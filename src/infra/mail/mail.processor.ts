import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../common/constants';
import { MailJob } from './mail.service';

/**
 * Consumes the email queue. Replace the body with a real SMTP/Nodemailer
 * or transactional-email-provider call. Kept as a logged no-op so the
 * scaffold runs without external credentials.
 */
@Processor(QUEUES.EMAIL)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  async process(job: Job<MailJob>): Promise<void> {
    const { to, subject } = job.data;
    // TODO: integrate Nodemailer / Resend / SES here.
    this.logger.log(`📧 [stub] Sending "${subject}" → ${to}`);
  }
}
