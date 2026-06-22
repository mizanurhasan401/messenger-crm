import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { AuthTokensDto } from './dto/auth.dto';
import { JwtAccessPayload } from './strategies/jwt.strategy';

/**
 * Owns all JWT signing and the cryptographic side of refresh-token rotation.
 * Refresh tokens are opaque random strings; only their SHA-256 hash is stored.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** SHA-256 — fast, deterministic, suitable for high-entropy random tokens. */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private accessTtlSeconds(): number {
    return this.parseTtl(this.config.get<string>('jwt.accessExpiresIn') ?? '15m');
  }

  refreshTtlSeconds(): number {
    return this.parseTtl(this.config.get<string>('jwt.refreshExpiresIn') ?? '7d');
  }

  async signAccessToken(user: Pick<User, 'id' | 'organizationId' | 'role' | 'email'>, jti: string) {
    const payload: JwtAccessPayload = {
      sub: user.id,
      org: user.organizationId,
      role: user.role,
      email: user.email,
      jti,
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessExpiresIn') as any,
      issuer: this.config.get<string>('jwt.issuer'),
      audience: this.config.get<string>('jwt.audience'),
    });
  }

  /** A refresh token is a signed JWT carrying its own jti + rotation family. */
  async signRefreshToken(userId: string, family: string, jti: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, family, jti },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn') as any,
      },
    );
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<{ sub: string; family: string; jti: string }> {
    return this.jwt.verifyAsync(token, {
      secret: this.config.get<string>('jwt.refreshSecret'),
    });
  }

  async issueTokens(
    user: Pick<User, 'id' | 'organizationId' | 'role' | 'email'>,
    family: string,
  ): Promise<{ tokens: AuthTokensDto; accessJti: string; refreshJti: string }> {
    const accessJti = randomUUID();
    const refreshJti = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user, accessJti),
      this.signRefreshToken(user.id, family, refreshJti),
    ]);
    return {
      tokens: { accessToken, refreshToken, expiresIn: this.accessTtlSeconds() },
      accessJti,
      refreshJti,
    };
  }

  newFamily(): string {
    return randomUUID();
  }

  /** Parse durations like "15m", "7d", "900s", or a raw number of seconds. */
  private parseTtl(value: string): number {
    const match = /^(\d+)(s|m|h|d)?$/.exec(value.trim());
    if (!match) return 900;
    const n = parseInt(match[1], 10);
    switch (match[2]) {
      case 'm':
        return n * 60;
      case 'h':
        return n * 3600;
      case 'd':
        return n * 86400;
      default:
        return n;
    }
  }
}
