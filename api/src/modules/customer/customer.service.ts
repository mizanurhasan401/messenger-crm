import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Customer, CustomerStatus } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { buildPaginationMeta, PaginatedResult } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { UserRepository } from '../user/user.repository';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import {
  AssignCustomerDto,
  ChangeCustomerStatusDto,
  UpdateCustomerDto,
} from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    private readonly repo: CustomerRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditLogService,
    private readonly tenant: TenantContext,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    if (dto.assignedToId) await this.assertAgentInOrg(dto.assignedToId);
    const customer = await this.repo.create({ ...dto });
    await this.audit.log(AuditAction.CUSTOMER_CREATE, 'Customer', customer.id, { name: customer.name });
    return customer;
  }

  async findAll(query: QueryCustomerDto): Promise<PaginatedResult<Customer>> {
    const [data, total] = await this.repo.paginate(query);
    return { data, meta: buildPaginationMeta(total, query.page, query.limit) };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    await this.findOne(id);
    if (dto.assignedToId) await this.assertAgentInOrg(dto.assignedToId);
    const updated = await this.repo.update(id, dto);
    await this.audit.log(AuditAction.CUSTOMER_UPDATE, 'Customer', id, { fields: Object.keys(dto) });
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
    await this.audit.log(AuditAction.CUSTOMER_DELETE, 'Customer', id);
  }

  async changeStatus(id: string, dto: ChangeCustomerStatusDto): Promise<Customer> {
    await this.findOne(id);
    await this.repo.setStatus(id, dto.status as CustomerStatus);
    await this.audit.log(AuditAction.CUSTOMER_UPDATE, 'Customer', id, { status: dto.status });
    return this.findOne(id);
  }

  async assign(id: string, dto: AssignCustomerDto): Promise<Customer> {
    await this.findOne(id);
    if (dto.assignedToId) await this.assertAgentInOrg(dto.assignedToId);
    const updated = await this.repo.update(id, { assignedToId: dto.assignedToId ?? null });
    await this.audit.log(AuditAction.CUSTOMER_UPDATE, 'Customer', id, {
      assignedToId: dto.assignedToId ?? null,
    });
    return updated;
  }

  /** Ensures the target agent belongs to the same tenant (no cross-org assignment). */
  private async assertAgentInOrg(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user || user.organizationId !== this.tenant.requireOrganizationId()) {
      throw new BadRequestException('Assigned agent must belong to your organization');
    }
  }
}
