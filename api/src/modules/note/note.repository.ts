import { Injectable } from '@nestjs/common';
import { Note, Prisma } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';

const noteInclude = {
  author: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.NoteInclude;

@Injectable()
export class NoteRepository extends BaseRepository {
  constructor(
    private readonly prisma: PrismaService,
    tenant: TenantContext,
  ) {
    super(tenant);
  }

  customerInOrg(customerId: string) {
    return this.prisma.customer.findFirst({
      where: { id: customerId, organizationId: this.orgId },
      select: { id: true },
    });
  }

  create(data: { customerId: string; content: string; authorId?: string }): Promise<Note> {
    return this.prisma.note.create({
      data: { ...data, organizationId: this.orgId },
    });
  }

  findById(id: string) {
    return this.prisma.note.findFirst({
      where: { id, organizationId: this.orgId },
      include: noteInclude,
    });
  }

  listByCustomer(customerId: string) {
    return this.prisma.note.findMany({
      where: { customerId, organizationId: this.orgId },
      include: noteInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, content: string): Promise<Prisma.BatchPayload> {
    return this.prisma.note.updateMany({
      where: { id, organizationId: this.orgId },
      data: { content },
    });
  }

  delete(id: string): Promise<Prisma.BatchPayload> {
    return this.prisma.note.deleteMany({ where: { id, organizationId: this.orgId } });
  }
}
