import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Thin wrapper around ioredis providing typed cache helpers and a
 * refresh-token blacklist used for JWT revocation.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) public readonly client: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, raw, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, raw);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length) await this.client.del(...keys);
  }

  /** Delete all keys matching a glob pattern (used for cache invalidation). */
  async delByPattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({ match: pattern, count: 100 });
    const pipeline = this.client.pipeline();
    for await (const keys of stream) {
      (keys as string[]).forEach((k) => pipeline.del(k));
    }
    await pipeline.exec();
  }

  // --- Refresh-token blacklist (JWT revocation) -------------------------

  blacklistKey(jti: string): string {
    return `bl:rt:${jti}`;
  }

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.client.set(this.blacklistKey(jti), '1', 'EX', ttlSeconds);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    return (await this.client.exists(this.blacklistKey(jti))) === 1;
  }
}
