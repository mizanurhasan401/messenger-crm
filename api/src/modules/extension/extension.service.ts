import { BadRequestException, Injectable } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { CustomerRepository } from '../customer/customer.repository';
import { NoteService } from '../note/note.service';
import { OrderService } from '../order/order.service';
import {
  ExtensionCustomerSyncDto,
  ExtensionNoteDto,
  ExtensionOrderDto,
} from './dto/extension.dto';

/**
 * Bridges the Chrome extension (which only knows Facebook identities) to the
 * CRM domain. Every operation resolves/creates a Customer by facebookId,
 * scoped to the authenticated user's organization.
 */
@Injectable()
export class ExtensionService {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly notes: NoteService,
    private readonly orders: OrderService,
    private readonly tenant: TenantContext,
  ) {}

  syncCustomer(dto: ExtensionCustomerSyncDto): Promise<Customer> {
    return this.customers.upsertByFacebookId(dto.facebookId, {
      name: dto.facebookName,
      facebookName: dto.facebookName,
      profileUrl: dto.profileUrl,
      lastMessage: dto.lastMessage,
      source: 'extension',
      lastContactedAt: new Date(),
    });
  }

  async addNote(dto: ExtensionNoteDto) {
    const customer = await this.resolveCustomer(dto.facebookId);
    return this.notes.create({ customerId: customer.id, content: dto.content });
  }

  async createOrder(dto: ExtensionOrderDto) {
    const customer = await this.resolveCustomer(dto.facebookId);
    return this.orders.create({
      customerId: customer.id,
      productName: dto.productName,
      quantity: dto.quantity ?? 1,
      amount: dto.amount,
    });
  }

  private async resolveCustomer(facebookId: string): Promise<Customer> {
    const existing = await this.customers.findByFacebookId(facebookId);
    if (existing) return existing;
    // Auto-create a lightweight customer if the extension didn't sync first.
    return this.customers.upsertByFacebookId(facebookId, {
      name: facebookId,
      facebookName: facebookId,
      source: 'extension',
    });
  }
}
