import { Injectable, NotFoundException } from '@nestjs/common';
import { Organization } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationRepository } from './organization.repository';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly repo: OrganizationRepository,
    private readonly tenant: TenantContext,
  ) {}

  async getCurrent(): Promise<Organization> {
    const org = await this.repo.findById(this.tenant.requireOrganizationId());
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateCurrent(dto: UpdateOrganizationDto): Promise<Organization> {
    await this.getCurrent();
    return this.repo.update(this.tenant.requireOrganizationId(), dto);
  }
}
