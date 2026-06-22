import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

/** Argon2id password hashing with configurable cost parameters. */
@Injectable()
export class PasswordService {
  constructor(private readonly config: ConfigService) {}

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: this.config.get<number>('argon.memoryCost'),
      timeCost: this.config.get<number>('argon.timeCost'),
      parallelism: this.config.get<number>('argon.parallelism'),
    });
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
