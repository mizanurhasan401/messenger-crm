import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateOrganizationInput,
  MemberStatus,
  Role,
  UpdateOrganizationInput,
} from "@messenger/shared";
import { PrismaService } from "../../prisma/prisma.service";

const DEFAULT_ROLES = [
  { name: "Owner", permissions: { "*": true } },
  { name: "Manager", permissions: { customers: true, orders: true, notes: true, followups: true, team: true } },
  { name: "Agent", permissions: { customers: true, orders: true, notes: true, followups: true } },
  { name: "Viewer", permissions: { read: true } },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates an org with the caller as OWNER, seeds default roles + trial subscription. */
  async create(userId: string, input: CreateOrganizationInput) {
    const base = input.slug ?? slugify(input.name);
    const slug = await this.ensureUniqueSlug(base);

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: input.name, slug, ownerUserId: userId },
      });
      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId,
          role: Role.OWNER,
          status: MemberStatus.ACTIVE,
          joinedAt: new Date(),
        },
      });
      await tx.orgRole.createMany({
        data: DEFAULT_ROLES.map((r) => ({ organizationId: org.id, ...r })),
      });
      await tx.subscription.create({ data: { organizationId: org.id } });
      return org;
    });
  }

  /** Orgs the user is an active member of (for the dashboard org-switcher). */
  async listForUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId, status: MemberStatus.ACTIVE },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      logoUrl: m.organization.logoUrl,
      role: m.role,
    }));
  }

  async get(orgId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException("Organization not found");
    return org;
  }

  async update(orgId: string, input: UpdateOrganizationInput) {
    return this.prisma.organization.update({ where: { id: orgId }, data: input });
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    let slug = base || "org";
    let n = 1;
    // Try base, then base-2, base-3, …
    // (org/membership creation is rare so the loop is cheap.)
    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${base}-${n}`;
      if (n > 50) throw new ConflictException("Could not allocate a unique slug");
    }
    return slug;
  }
}
