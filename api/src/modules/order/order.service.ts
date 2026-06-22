import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Order } from '@prisma/client';
import { buildPaginationMeta, PaginatedResult } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { ChangeOrderStatusDto, UpdateOrderDto } from './dto/update-order.dto';
import { OrderRepository } from './order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly repo: OrderRepository,
    private readonly audit: AuditLogService,
  ) {}

  /** total = amount * quantity - discount + shippingFee (never negative). */
  private computeTotal(amount: number, quantity: number, discount = 0, shippingFee = 0): number {
    const total = amount * quantity - discount + shippingFee;
    return Math.max(0, Number(total.toFixed(2)));
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const customer = await this.repo.customerInOrg(dto.customerId);
    if (!customer) throw new BadRequestException('Customer not found in your organization');

    const total = this.computeTotal(dto.amount, dto.quantity, dto.discount, dto.shippingFee);
    const orderNumber = await this.repo.nextOrderNumber();

    const order = await this.repo.create({
      customerId: dto.customerId,
      orderNumber,
      productName: dto.productName,
      quantity: dto.quantity,
      amount: dto.amount,
      discount: dto.discount ?? 0,
      shippingFee: dto.shippingFee ?? 0,
      total,
      status: dto.status,
      paymentStatus: dto.paymentStatus,
      notes: dto.notes,
    });

    await this.audit.log(AuditAction.ORDER_CREATE, 'Order', order.id, { orderNumber, total });
    return order;
  }

  async findAll(query: QueryOrderDto): Promise<PaginatedResult<Order>> {
    const [data, total] = await this.repo.paginate(query);
    return { data, meta: buildPaginationMeta(total, query.page, query.limit) };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    const existing = await this.findOne(id);
    if (dto.customerId) {
      const customer = await this.repo.customerInOrg(dto.customerId);
      if (!customer) throw new BadRequestException('Customer not found in your organization');
    }

    // Recompute total if any monetary field changed.
    const amount = dto.amount ?? Number(existing.amount);
    const quantity = dto.quantity ?? existing.quantity;
    const discount = dto.discount ?? Number(existing.discount);
    const shippingFee = dto.shippingFee ?? Number(existing.shippingFee);
    const total = this.computeTotal(amount, quantity, discount, shippingFee);

    await this.repo.update(id, { ...dto, total });
    await this.audit.log(AuditAction.ORDER_UPDATE, 'Order', id, { fields: Object.keys(dto) });
    return this.findOne(id);
  }

  async changeStatus(id: string, dto: ChangeOrderStatusDto): Promise<Order> {
    await this.findOne(id);
    await this.repo.setStatus(id, dto.status);
    await this.audit.log(AuditAction.ORDER_UPDATE, 'Order', id, { status: dto.status });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
    await this.audit.log(AuditAction.ORDER_DELETE, 'Order', id);
  }
}
