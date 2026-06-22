import { Injectable } from '@nestjs/common';
import { Prisma, Tag } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class TagRepository extends BaseRepository {
  constructor(
    private readonly prisma: PrismaService,
    tenant: TenantContext,
  ) {
    super(tenant);
  }

  create(data: { name: string; color?: string }): Promise<Tag> {
    return this.prisma.tag.create({ data: { ...data, organizationId: this.orgId } });
  }

  findAll(): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { organizationId: this.orgId },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string): Promise<Tag | null> {
    return this.prisma.tag.findFirst({ where: { id, organizationId: this.orgId } });
  }

  update(id: string, data: Prisma.TagUpdateInput): Promise<Prisma.BatchPayload> {
    return this.prisma.tag.updateMany({ where: { id, organizationId: this.orgId }, data });
  }

  delete(id: string): Promise<Prisma.BatchPayload> {
    return this.prisma.tag.deleteMany({ where: { id, organizationId: this.orgId } });
  }

  // --- pivot: customer_tags --------------------------------------------

  customerInOrg(customerId: string) {
    return this.prisma.customer.findFirst({
      where: { id: customerId, organizationId: this.orgId },
      select: { id: true },
    });
  }

  attach(customerId: string, tagId: string) {
    return this.prisma.customerTag.upsert({
      where: { customerId_tagId: { customerId, tagId } },
      create: { customerId, tagId },
      update: {},
    });
  }

  detach(customerId: string, tagId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.customerTag.deleteMany({ where: { customerId, tagId } });
  }
}
