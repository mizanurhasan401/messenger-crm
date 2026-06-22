import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditAction, Role, User } from '@prisma/client';
import { randomBytes, randomUUID } from 'crypto';
import { SafeUser, UserService } from '../user/user.service';
import { UserRepository } from '../user/user.repository';
import { OrganizationRepository } from '../organization/organization.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import { MailService } from '../../infra/mail/mail.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuthRepository } from './auth.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import {
  AuthTokensDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserRepository,
    private readonly orgs: OrganizationRepository,
    private readonly authRepo: AuthRepository,
    private readonly tokens: TokenService,
    private readonly passwords: PasswordService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
    private readonly audit: AuditLogService,
  ) {}

  // -------------------------------------------------------------------
  // REGISTER — creates a new organization + its OWNER user (transaction).
  // -------------------------------------------------------------------
  async register(dto: RegisterDto, meta: RequestMeta): Promise<{ user: SafeUser; tokens: AuthTokensDto }> {
    const slug = await this.uniqueSlug(dto.organizationName);
    const passwordHash = await this.passwords.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: dto.organizationName, slug },
      });
      await tx.subscription.create({ data: { organizationId: org.id } });
      return tx.user.create({
        data: {
          organizationId: org.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: Role.OWNER,
        },
      });
    });

    await this.sendVerification(user);
    const tokens = await this.startSession(user, meta);
    return { user: UserService.sanitize(user), tokens };
  }

  // -------------------------------------------------------------------
  // LOGIN
  // -------------------------------------------------------------------
  async login(dto: LoginDto, meta: RequestMeta): Promise<{ user: SafeUser; tokens: AuthTokensDto }> {
    const user = await this.users.findFirstByEmail(dto.email);
    // Constant-ish failure path to reduce user enumeration.
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await this.passwords.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.users.setLastLogin(user.id);
    const tokens = await this.startSession(user, meta);

    await this.audit.record({
      organizationId: user.organizationId,
      userId: user.id,
      action: AuditAction.LOGIN,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return { user: UserService.sanitize(user), tokens };
  }

  // -------------------------------------------------------------------
  // REFRESH — rotation with reuse detection.
  // -------------------------------------------------------------------
  async refresh(refreshToken: string, meta: RequestMeta): Promise<AuthTokensDto> {
    let payload: { sub: string; family: string; jti: string };
    try {
      payload = await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.tokens.hashToken(refreshToken);
    const stored = await this.authRepo.findRefreshByHash(tokenHash);

    // Token unknown or already rotated/revoked → possible theft. Burn family.
    if (!stored || stored.revokedAt) {
      await this.authRepo.revokeFamily(payload.family);
      throw new UnauthorizedException('Refresh token reuse detected — session revoked');
    }
    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedException('Account inactive');

    // Rotate: revoke the presented token, issue a fresh pair in same family.
    await this.authRepo.revokeRefreshToken(stored.id);
    const tokens = await this.issueAndPersist(user, stored.family, meta);
    return tokens;
  }

  // -------------------------------------------------------------------
  // LOGOUT — revoke refresh token + blacklist current access jti.
  // -------------------------------------------------------------------
  async logout(refreshToken: string | undefined, accessJti?: string): Promise<void> {
    if (refreshToken) {
      const stored = await this.authRepo.findRefreshByHash(this.tokens.hashToken(refreshToken));
      if (stored && !stored.revokedAt) await this.authRepo.revokeRefreshToken(stored.id);
    }
    if (accessJti) {
      await this.redis.blacklistToken(accessJti, this.tokens.refreshTtlSeconds());
    }
  }

  // -------------------------------------------------------------------
  // FORGOT / RESET PASSWORD
  // -------------------------------------------------------------------
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.users.findFirstByEmail(dto.email);
    // Always succeed silently to avoid leaking which emails exist.
    if (!user) return;

    const raw = randomBytes(32).toString('hex');
    await this.authRepo.createVerificationToken({
      userId: user.id,
      tokenHash: this.tokens.hashToken(raw),
      type: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await this.mail.sendPasswordResetEmail(user.email, raw);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const record = await this.authRepo.findVerification(
      this.tokens.hashToken(dto.token),
      'PASSWORD_RESET',
    );
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const passwordHash = await this.passwords.hash(dto.newPassword);
    await this.users.update(record.userId, { passwordHash });
    await this.authRepo.markVerificationUsed(record.id);
    // Invalidate all existing sessions after a password reset.
    await this.authRepo.revokeAllForUser(record.userId);
  }

  // -------------------------------------------------------------------
  // EMAIL VERIFICATION
  // -------------------------------------------------------------------
  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const record = await this.authRepo.findVerification(
      this.tokens.hashToken(dto.token),
      'EMAIL_VERIFY',
    );
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    await this.users.update(record.userId, { emailVerified: true });
    await this.authRepo.markVerificationUsed(record.id);
  }

  // -------------------------------------------------------------------
  // CHANGE PASSWORD (authenticated)
  // -------------------------------------------------------------------
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    const ok = await this.passwords.verify(user.passwordHash, dto.currentPassword);
    if (!ok) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await this.passwords.hash(dto.newPassword);
    await this.users.update(userId, { passwordHash });
    await this.authRepo.revokeAllForUser(userId);
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    return UserService.sanitize(user);
  }

  // ===================================================================
  // Internal helpers
  // ===================================================================

  private async startSession(user: User, meta: RequestMeta): Promise<AuthTokensDto> {
    const family = this.tokens.newFamily();
    return this.issueAndPersist(user, family, meta);
  }

  private async issueAndPersist(
    user: User,
    family: string,
    meta: RequestMeta,
  ): Promise<AuthTokensDto> {
    const { tokens } = await this.tokens.issueTokens(user, family);
    await this.authRepo.createRefreshToken({
      userId: user.id,
      tokenHash: this.tokens.hashToken(tokens.refreshToken),
      family,
      expiresAt: new Date(Date.now() + this.tokens.refreshTtlSeconds() * 1000),
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return tokens;
  }

  private async sendVerification(user: User): Promise<void> {
    const raw = randomBytes(32).toString('hex');
    await this.authRepo.createVerificationToken({
      userId: user.id,
      tokenHash: this.tokens.hashToken(raw),
      type: 'EMAIL_VERIFY',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await this.mail.sendVerificationEmail(user.email, raw);
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'org';
    let slug = base;
    let attempt = 0;
    while (await this.orgs.findBySlug(slug)) {
      attempt += 1;
      slug = `${base}-${randomUUID().slice(0, 6)}`;
      if (attempt > 5) throw new ConflictException('Could not allocate organization slug');
    }
    return slug;
  }
}
