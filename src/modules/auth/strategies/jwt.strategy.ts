import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../../common/decorators/current-user.decorator';
import { RedisService } from '../../../infra/redis/redis.service';

export interface JwtAccessPayload {
  sub: string; // user id
  org: string; // organization id
  role: string;
  email: string;
  jti: string;
}

/**
 * Validates the access token signature/expiry and rebuilds the AuthUser.
 * Also honors the refresh-token blacklist by jti for instant revocation.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
      issuer: config.get<string>('jwt.issuer'),
      audience: config.get<string>('jwt.audience'),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthUser> {
    if (payload.jti && (await this.redis.isBlacklisted(payload.jti))) {
      throw new UnauthorizedException('Token has been revoked');
    }
    return {
      id: payload.sub,
      organizationId: payload.org,
      role: payload.role,
      email: payload.email,
      jti: payload.jti,
    };
  }
}
