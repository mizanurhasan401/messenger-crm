import { Injectable } from '@nestjs/common';
import { AuditAction, AuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AuditLogUncheckedCreateInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  async paginate(params: {
    organizationId: string;
    skip: number;
    take: number;
    action?: AuditAction;
  }): Promise<[AuditLog[], number]> {
    const where: Prisma.AuditLogWhereInput = {
      organizationId: params.organizationId,
      ...(params.action ? { action: params.action } : {}),
    };
    return this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
  }
}
