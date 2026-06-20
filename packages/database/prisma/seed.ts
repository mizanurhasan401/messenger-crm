/**
 * Seed: creates a demo organization, an owner user, default org roles, a couple
 * of customers/orders and quick replies so the dashboard has data on first run.
 *
 * NOTE: passwords/credentials are created by Better Auth at runtime, not here —
 * this seed only creates an unverified shell user + org so you can sign up against
 * the same email, or use it for local e2e fixtures.
 */
import { PrismaClient, Role, MemberStatus, OrderStatus } from "../src/generated/client";

const prisma = new PrismaClient();

const DEFAULT_ROLES: Array<{ name: string; permissions: Record<string, boolean> }> = [
  { name: "Owner", permissions: { "*": true } },
  {
    name: "Manager",
    permissions: { customers: true, orders: true, notes: true, followups: true, team: true },
  },
  {
    name: "Agent",
    permissions: { customers: true, orders: true, notes: true, followups: true },
  },
  { name: "Viewer", permissions: { read: true } },
];

async function main() {
  const ownerEmail = "owner@demo.test";

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: { email: ownerEmail, name: "Demo Owner", emailVerified: true },
  });

  const org = await prisma.organization.upsert({
    where: { slug: "demo-shop" },
    update: {},
    create: { name: "Demo Shop", slug: "demo-shop", ownerUserId: owner.id },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: owner.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: owner.id,
      role: Role.OWNER,
      status: MemberStatus.ACTIVE,
      joinedAt: new Date(),
    },
  });

  for (const r of DEFAULT_ROLES) {
    await prisma.orgRole.upsert({
      where: { organizationId_name: { organizationId: org.id, name: r.name } },
      update: { permissions: r.permissions },
      create: { organizationId: org.id, name: r.name, permissions: r.permissions },
    });
  }

  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {},
    create: { organizationId: org.id },
  });

  const customer = await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: "Rahim Uddin",
      phone: "+8801700000000",
      fbName: "Rahim Uddin",
      source: "manual",
      createdBy: owner.id,
    },
  });

  await prisma.order.create({
    data: {
      organizationId: org.id,
      customerId: customer.id,
      orderNumber: "ORD-0001",
      status: OrderStatus.PENDING,
      items: [{ name: "T-Shirt", qty: 2, price: 600 }],
      subtotal: 1200,
      shippingFee: 80,
      total: 1280,
      currency: "BDT",
      createdBy: owner.id,
      timeline: {
        create: { organizationId: org.id, toStatus: OrderStatus.PENDING, changedBy: owner.id },
      },
    },
  });

  await prisma.quickReply.createMany({
    data: [
      {
        organizationId: org.id,
        title: "Price",
        shortcut: "/price",
        content: "Price: 1200 BDT\nDelivery: 80 BDT\nCash on Delivery Available",
        createdBy: owner.id,
      },
      {
        organizationId: org.id,
        title: "Location",
        shortcut: "/location",
        content: "We deliver all over Bangladesh.",
        createdBy: owner.id,
      },
    ],
    skipDuplicates: true,
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded org "${org.name}" (${org.slug}) with owner ${ownerEmail}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
