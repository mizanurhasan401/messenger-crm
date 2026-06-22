import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { QUEUES } from '../../common/constants';

export interface MailJob {
  to: string;
  subject: string;
  html: string;
}

/**
 * Mail producer — enqueues emails for asynchronous delivery so request
 * latency never depends on SMTP. The MailProcessor consumes the queue.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectQueue(QUEUES.EMAIL) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  private async enqueue(job: MailJob): Promise<void> {
    await this.queue.add('send', job);
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${this.config.get('mail.frontendUrl')}/verify-email?token=${token}`;
    await this.enqueue({
      to,
      subject: 'Verify your email',
      html: `<p>Welcome! Confirm your email:</p><p><a href="${url}">Verify Email</a></p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${this.config.get('mail.frontendUrl')}/reset-password?token=${token}`;
    await this.enqueue({
      to,
      subject: 'Reset your password',
      html: `<p>Reset your password:</p><p><a href="${url}">Reset Password</a></p>`,
    });
  }
}
