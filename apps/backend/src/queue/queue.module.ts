import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.validation";
import { QUEUES } from "./queue.constants";

/**
 * Registers the BullMQ connection (Redis) and the platform's queues. Imported by
 * modules that produce/consume jobs (CSV import, followup reminders).
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const url = new URL(config.get("REDIS_URL", { infer: true }));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            password: url.password || undefined,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: QUEUES.CSV_IMPORT },
      { name: QUEUES.FOLLOWUP_REMINDER },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
