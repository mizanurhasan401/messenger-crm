import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuditLogService } from '../audit-log/audit-log.service';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let repo: jest.Mocked<Partial<OrderRepository>>;
  let audit: jest.Mocked<Partial<AuditLogService>>;

  beforeEach(async () => {
    repo = {
      customerInOrg: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      nextOrderNumber: jest.fn().mockResolvedValue('ORD-00001'),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: repo },
        { provide: AuditLogService, useValue: audit },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  describe('create', () => {
    it('rejects when the customer is not in the tenant org', async () => {
      (repo.customerInOrg as jest.Mock).mockResolvedValue(null);
      await expect(
        service.create({ customerId: 'c1', productName: 'X', quantity: 1, amount: 100 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('computes total = amount*qty - discount + shipping and audits', async () => {
      (repo.customerInOrg as jest.Mock).mockResolvedValue({ id: 'c1' });
      (repo.create as jest.Mock).mockImplementation((d) => Promise.resolve({ id: 'o1', ...d }));

      const order: any = await service.create({
        customerId: 'c1',
        productName: 'Hoodie',
        quantity: 2,
        amount: 1200,
        discount: 100,
        shippingFee: 60,
      });

      // 1200*2 - 100 + 60 = 2360
      expect(order.total).toBe(2360);
      expect(order.orderNumber).toBe('ORD-00001');
      expect(audit.log).toHaveBeenCalled();
    });

    it('never produces a negative total', async () => {
      (repo.customerInOrg as jest.Mock).mockResolvedValue({ id: 'c1' });
      (repo.create as jest.Mock).mockImplementation((d) => Promise.resolve({ id: 'o1', ...d }));

      const order: any = await service.create({
        customerId: 'c1',
        productName: 'Freebie',
        quantity: 1,
        amount: 10,
        discount: 9999,
      });
      expect(order.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('throws NotFound when missing', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
