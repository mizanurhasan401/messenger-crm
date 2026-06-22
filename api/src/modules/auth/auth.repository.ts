import { Injectable } from '@nestjs/common';
import { RefreshToken, VerificationToken } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export type TokenType = 'EMAIL_VERIFY' | 'PASSWORD_RESET';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Refresh tokens (rotation + reuse detection) ---------------------

  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    family: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  findRefreshByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({ where: { tokenHash } });
  }

  revokeRefreshToken(id: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  /** Reuse detected → nuke the whole rotation family (force re-login). */
  revokeFamily(family: string): Promise<{ count: number }> {
    return this.prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllForUser(userId: string): Promise<{ count: number }> {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // --- Verification / reset tokens -------------------------------------

  createVerificationToken(data: {
    userId: string;
    tokenHash: string;
    type: TokenType;
    expiresAt: Date;
  }): Promise<VerificationToken> {
    return this.prisma.verificationToken.create({ data });
  }

  findVerification(tokenHash: string, type: TokenType): Promise<VerificationToken | null> {
    return this.prisma.verificationToken.findFirst({
      where: { tokenHash, type, usedAt: null },
    });
  }

  markVerificationUsed(id: string): Promise<VerificationToken> {
    return this.prisma.verificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
