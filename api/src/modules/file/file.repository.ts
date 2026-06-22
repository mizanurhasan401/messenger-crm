import { Injectable } from '@nestjs/common';
import { FileObject, FileStatus, Prisma } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class FileRepository extends BaseRepository {
  constructor(
    private readonly prisma: PrismaService,
    tenant: TenantContext,
  ) {
    super(tenant);
  }

  create(data: Omit<Prisma.FileObjectUncheckedCreateInput, 'organizationId'>): Promise<FileObject> {
    return this.prisma.fileObject.create({ data: { ...data, organizationId: this.orgId } });
  }

  findByKey(key: string): Promise<FileObject | null> {
    return this.prisma.fileObject.findFirst({ where: { key, organizationId: this.orgId } });
  }

  findById(id: string): Promise<FileObject | null> {
    return this.prisma.fileObject.findFirst({ where: { id, organizationId: this.orgId } });
  }

  markStatus(id: string, status: FileStatus): Promise<FileObject> {
    return this.prisma.fileObject.update({ where: { id }, data: { status } });
  }

  delete(id: string): Promise<Prisma.BatchPayload> {
    return this.prisma.fileObject.deleteMany({ where: { id, organizationId: this.orgId } });
  }
}
