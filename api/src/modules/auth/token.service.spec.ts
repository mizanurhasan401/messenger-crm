import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  const jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() } as unknown as JwtService;

  const config = {
    get: (key: string) => {
      const map: Record<string, string> = {
        'jwt.accessSecret': 'a',
        'jwt.refreshSecret': 'r',
        'jwt.accessExpiresIn': '15m',
        'jwt.refreshExpiresIn': '7d',
        'jwt.issuer': 'iss',
        'jwt.audience': 'aud',
      };
      return map[key];
    },
  } as unknown as ConfigService;

  beforeEach(() => {
    service = new TokenService(jwt, config);
  });

  it('hashes tokens deterministically (sha256)', () => {
    const h1 = service.hashToken('abc');
    const h2 = service.hashToken('abc');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it('parses refresh TTL of 7d into seconds', () => {
    expect(service.refreshTtlSeconds()).toBe(7 * 86400);
  });

  it('generates unique rotation families', () => {
    expect(service.newFamily()).not.toBe(service.newFamily());
  });
});
