/**
 * P1 gate: proves the tenant Prisma extension prevents cross-organization reads.
 * Requires a reachable Postgres (DATABASE_URL) with migrations applied.
 *
 *   docker compose up -d && pnpm db:migrate && pnpm --filter @messenger/backend test:e2e
 */
import { PrismaService } from "../../src/prisma/prisma.service";
import { tenantClientForJob } from "../../src/prisma/tenant-prisma.service";

describe("tenant isolation", () => {
  const prisma = new PrismaService();
  let orgA: string;
  let orgB: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.$connect();
    const user = await prisma.user.create({
      data: { email: `iso-${Date.now()}@test.local`, name: "Iso" },
    });
    userId = user.id;
    const a = await prisma.organization.create({
      data: { name: "Org A", slug: `org-a-${Date.now()}`, ownerUserId: userId },
    });
    const b = await prisma.organization.create({
      data: { name: "Org B", slug: `org-b-${Date.now()}`, ownerUserId: userId },
    });
    orgA = a.id;
    orgB = b.id;
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({ where: { id: { in: [orgA, orgB] } } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("org A's scoped client cannot read org B's customers", async () => {
    const clientA = tenantClientForJob(prisma, orgA);
    const clientB = tenantClientForJob(prisma, orgB);

    await clientB.customer.create({ data: { name: "B-secret", createdBy: userId } });

    const visibleToA = await clientA.customer.findMany();
    expect(visibleToA.find((c) => c.name === "B-secret")).toBeUndefined();

    const visibleToB = await clientB.customer.findMany();
    expect(visibleToB.find((c) => c.name === "B-secret")).toBeDefined();
  });

  it("auto-stamps organizationId on create", async () => {
    const clientA = tenantClientForJob(prisma, orgA);
    const created = await clientA.customer.create({ data: { name: "A-cust", createdBy: userId } });
    expect(created.organizationId).toBe(orgA);
  });
});
