import { Injectable } from '@nestjs/common';
import { Customer, CustomerStatus, Prisma } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { QueryCustomerDto } from './dto/query-customer.dto';

const customerInclude = {
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
  customerTags: { include: { tag: true } },
  _count: { select: { orders: true, notes: true } },
} satisfies Prisma.CustomerInclude;

@Injectable()
export class CustomerRepository extends BaseRepository {
  constructor(
    private readonly prisma: PrismaService,
    tenant: TenantContext,
  ) {
    super(tenant);
  }

  create(data: Omit<Prisma.CustomerUncheckedCreateInput, 'organizationId'>): Promise<Customer> {
    return this.prisma.customer.create({
      data: { ...data, organizationId: this.orgId },
    });
  }

  findById(id: string) {
    return this.prisma.customer.findFirst({
      where: { id, organizationId: this.orgId },
      include: customerInclude,
    });
  }

  update(id: string, data: Prisma.CustomerUncheckedUpdateInput): Promise<Customer> {
    // updateMany guards tenant scope; then return the fresh record.
    return this.prisma.customer
      .updateMany({ where: { id, organizationId: this.orgId }, data })
      .then(() => this.prisma.customer.findUniqueOrThrow({ where: { id } }));
  }

  delete(id: string): Promise<Prisma.BatchPayload> {
    return this.prisma.customer.deleteMany({ where: { id, organizationId: this.orgId } });
  }

  async paginate(query: QueryCustomerDto): Promise<[Customer[], number]> {
    const where: Prisma.CustomerWhereInput = {
      organizationId: this.orgId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.tagId ? { customerTags: { some: { tagId: query.tagId } } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { facebookName: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        include: customerInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.customer.count({ where }),
    ]);
  }

  setStatus(id: string, status: CustomerStatus): Promise<Prisma.BatchPayload> {
    return this.prisma.customer.updateMany({
      where: { id, organizationId: this.orgId },
      data: { status },
    });
  }

  countByOrg(): Promise<number> {
    return this.prisma.customer.count({ where: { organizationId: this.orgId } });
  }

  findByFacebookId(facebookId: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({ where: { facebookId, organizationId: this.orgId } });
  }

  /** Upsert a customer by (organization, facebookId) — used by the extension sync. */
  upsertByFacebookId(
    facebookId: string,
    data: Omit<Prisma.CustomerUncheckedCreateInput, 'organizationId' | 'facebookId'>,
  ): Promise<Customer> {
    return this.prisma.customer.upsert({
      where: { organizationId_facebookId: { organizationId: this.orgId, facebookId } },
      create: { ...data, facebookId, organizationId: this.orgId },
      update: {
        // Only refresh the live messenger fields; never clobber CRM-owned data.
        facebookName: data.facebookName,
        profileUrl: data.profileUrl,
        lastMessage: data.lastMessage,
        lastContactedAt: new Date(),
      },
    });
  }
}
