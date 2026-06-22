import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PresignedUpload {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
}

/**
 * Cloudflare R2 storage (S3-compatible) using the AWS SDK v3.
 * Generates presigned PUT URLs for direct browser uploads and presigned
 * GET URLs for private downloads.
 */
@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl?: string;
  private readonly ttl: number;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('r2.bucket')!;
    this.publicUrl = this.config.get<string>('r2.publicUrl');
    this.ttl = this.config.get<number>('r2.signedUrlTtl')!;

    this.client = new S3Client({
      region: 'auto',
      endpoint: this.config.get<string>('r2.endpoint'),
      credentials: {
        accessKeyId: this.config.get<string>('r2.accessKeyId')!,
        secretAccessKey: this.config.get<string>('r2.secretAccessKey')!,
      },
    });
  }

  /** Build a tenant-namespaced object key. */
  buildKey(organizationId: string, filename: string): string {
    const safe = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const stamp = Math.floor(Date.now() / 1000);
    return `org/${organizationId}/${stamp}-${safe}`;
  }

  async createPresignedUpload(
    key: string,
    contentType: string,
  ): Promise<PresignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: this.ttl });
    return {
      key,
      uploadUrl,
      publicUrl: this.publicUrl ? `${this.publicUrl}/${key}` : '',
      expiresIn: this.ttl,
    };
  }

  async createPresignedDownload(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: this.ttl });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
