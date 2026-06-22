import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Data access for users. Auth flows (which run before a tenant context
 * exists) call the explicit-org methods; tenant-scoped admin flows pass the
 * organizationId from the request context.
 */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmailInOrg(organizationId: string, email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { organizationId_email: { organizationId, email } },
    });
  }

  /** Used at login when the org is not yet known — email is globally findable. */
  findFirstByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email } });
  }

  create(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUncheckedUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  setLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  countByOrg(organizationId: string): Promise<number> {
    return this.prisma.user.count({ where: { organizationId } });
  }

  listByOrg(organizationId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async paginate(
    organizationId: string,
    query: PaginationQueryDto,
  ): Promise<[User[], number]> {
    const where: Prisma.UserWhereInput = {
      organizationId,
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
  }

  updateRole(id: string, role: Role): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }
}
