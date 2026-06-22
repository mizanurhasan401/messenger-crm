import { Injectable, NotFoundException } from '@nestjs/common';
import { FileStatus } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { R2Service } from '../../infra/storage/r2.service';
import { ConfirmUploadDto, PresignUploadDto } from './dto/file.dto';
import { FileRepository } from './file.repository';

@Injectable()
export class FileService {
  constructor(
    private readonly repo: FileRepository,
    private readonly r2: R2Service,
    private readonly tenant: TenantContext,
  ) {}

  /**
   * Step 1: create a PENDING file record and return a presigned PUT URL so the
   * client can upload directly to R2 (bypassing the API server).
   */
  async presignUpload(dto: PresignUploadDto) {
    const orgId = this.tenant.requireOrganizationId();
    const key = this.r2.buildKey(orgId, dto.filename);
    const presigned = await this.r2.createPresignedUpload(key, dto.contentType);

    const file = await this.repo.create({
      uploadedById: this.tenant.userId,
      key,
      filename: dto.filename,
      mimeType: dto.contentType,
      size: dto.size,
      status: FileStatus.PENDING,
      url: presigned.publicUrl || null,
    });

    return { file, upload: presigned };
  }

  /** Step 2: client confirms the upload completed → mark UPLOADED. */
  async confirmUpload(dto: ConfirmUploadDto) {
    const file = await this.repo.findByKey(dto.key);
    if (!file) throw new NotFoundException('File not found');
    return this.repo.markStatus(file.id, FileStatus.UPLOADED);
  }

  /** Generate a short-lived download URL for a private object. */
  async getDownloadUrl(id: string) {
    const file = await this.repo.findById(id);
    if (!file) throw new NotFoundException('File not found');
    const url = await this.r2.createPresignedDownload(file.key);
    return { url, file };
  }

  async remove(id: string): Promise<void> {
    const file = await this.repo.findById(id);
    if (!file) throw new NotFoundException('File not found');
    await this.r2.delete(file.key);
    await this.repo.delete(id);
  }
}
