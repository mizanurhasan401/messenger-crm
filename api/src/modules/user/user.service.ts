import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import {
  buildPaginationMeta,
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { AppRole } from '../../common/enums/role.enum';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';

/** Strips secrets before a user object ever leaves the service layer. */
export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly tenant: TenantContext,
  ) {}

  static sanitize(user: User): SafeUser {
    const { passwordHash: _omit, ...rest } = user;
    return rest;
  }

  async findMe(userId: string): Promise<SafeUser> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return UserService.sanitize(user);
  }

  async list(query: PaginationQueryDto): Promise<PaginatedResult<SafeUser>> {
    const [users, total] = await this.repo.paginate(
      this.tenant.requireOrganizationId(),
      query,
    );
    return {
      data: users.map(UserService.sanitize),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.getInOrg(id);
    return UserService.sanitize(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    await this.getInOrg(id);
    const updated = await this.repo.update(id, dto);
    return UserService.sanitize(updated);
  }

  async changeRole(id: string, dto: UpdateUserRoleDto): Promise<SafeUser> {
    const target = await this.getInOrg(id);
    // Guard: nobody can create/elevate another OWNER except an OWNER.
    if (dto.role === AppRole.OWNER && this.tenant.role !== AppRole.OWNER) {
      throw new ForbiddenException('Only an OWNER can assign the OWNER role');
    }
    const updated = await this.repo.updateRole(target.id, dto.role);
    return UserService.sanitize(updated);
  }

  /** Fetch a user and assert it belongs to the current tenant. */
  private async getInOrg(id: string): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user || user.organizationId !== this.tenant.requireOrganizationId()) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
