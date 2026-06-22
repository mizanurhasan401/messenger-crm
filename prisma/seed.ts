/* eslint-disable no-console */
import { PrismaClient, Role, CustomerStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const org = await prisma.organization.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { name: 'Acme Commerce', slug: 'acme' },
  });

  const passwordHash = await argon2.hash('Password123!');

  const owner = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'owner@acme.test' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'owner@acme.test',
      passwordHash,
      firstName: 'Olivia',
      lastName: 'Owner',
      role: Role.OWNER,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'agent@acme.test' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'agent@acme.test',
      passwordHash,
      firstName: 'Aaron',
      lastName: 'Agent',
      role: Role.AGENT,
      emailVerified: true,
    },
  });

  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {},
    create: { organizationId: org.id, plan: 'PRO', status: 'ACTIVE', seats: 10 },
  });

  const tag = await prisma.tag.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'VIP' } },
    update: {},
    create: { organizationId: org.id, name: 'VIP', color: '#f59e0b' },
  });

  const customer = await prisma.customer.upsert({
    where: { organizationId_facebookId: { organizationId: org.id, facebookId: 'fb_1001' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Jane Buyer',
      facebookName: 'Jane B.',
      facebookId: 'fb_1001',
      phone: '+8801700000000',
      status: CustomerStatus.INTERESTED,
      source: 'messenger',
      assignedToId: owner.id,
    },
  });

  await prisma.customerTag.upsert({
    where: { customerId_tagId: { customerId: customer.id, tagId: tag.id } },
    update: {},
    create: { customerId: customer.id, tagId: tag.id },
  });

  await prisma.order.upsert({
    where: { organizationId_orderNumber: { organizationId: org.id, orderNumber: 'ORD-0001' } },
    update: {},
    create: {
      organizationId: org.id,
      customerId: customer.id,
      orderNumber: 'ORD-0001',
      productName: 'Premium Hoodie',
      quantity: 2,
      amount: 1200,
      discount: 100,
      shippingFee: 60,
      total: 1160,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PARTIAL,
    },
  });

  console.log('✅ Seed complete. Login: owner@acme.test / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
