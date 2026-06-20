import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InviteMemberInput, MemberStatus, Role, ROLE_RANK } from "@messenger/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string) {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    });
    return members.map((m) => ({
      id: m.id,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      user: m.user,
    }));
  }

  /**
   * Invite by email. Creates a shell user if none exists, then an INVITED
   * membership. The invitee completes signup via Better Auth using the same email.
   * (Email delivery wired in Phase 7.)
   */
  async invite(orgId: string, invitedBy: string, input: InviteMemberInput) {
    const user = await this.prisma.user.upsert({
      where: { email: input.email },
      update: {},
      create: { email: input.email },
    });

    const existing = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    });
    if (existing) throw new BadRequestException("User is already a member or invited");

    return this.prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: input.role,
        status: MemberStatus.INVITED,
        invitedBy,
      },
    });
  }

  async updateRole(orgId: string, actorRole: Role, memberId: string, role: Role) {
    const member = await this.getMember(orgId, memberId);
    if (member.role === Role.OWNER) throw new ForbiddenException("Cannot change the owner's role");
    if (ROLE_RANK[role] >= ROLE_RANK[actorRole]) {
      throw new ForbiddenException("Cannot assign a role equal to or above your own");
    }
    return this.prisma.organizationMember.update({ where: { id: memberId }, data: { role } });
  }

  async remove(orgId: string, memberId: string) {
    const member = await this.getMember(orgId, memberId);
    if (member.role === Role.OWNER) throw new ForbiddenException("Cannot remove the owner");
    await this.prisma.organizationMember.delete({ where: { id: memberId } });
    return { removed: true };
  }

  private async getMember(orgId: string, memberId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: orgId },
    });
    if (!member) throw new NotFoundException("Member not found");
    return member;
  }
}
