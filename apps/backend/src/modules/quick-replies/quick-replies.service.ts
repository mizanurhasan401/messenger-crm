import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateQuickReplyInput, UpdateQuickReplyInput } from "@messenger/shared";
import type { Prisma } from "@messenger/database";
import { TenantPrismaService } from "../../prisma/tenant-prisma.service";

@Injectable()
export class QuickRepliesService {
  constructor(private readonly db: TenantPrismaService) {}

  list() {
    return this.db.client.quickReply.findMany({ orderBy: { shortcut: "asc" } });
  }

  async create(userId: string, input: CreateQuickReplyInput) {
    await this.assertShortcutFree(input.shortcut);
    return this.db.client.quickReply.create({
      data: { ...input, createdBy: userId } as Prisma.QuickReplyUncheckedCreateInput,
    });
  }

  async update(id: string, input: UpdateQuickReplyInput) {
    await this.getOrThrow(id);
    if (input.shortcut) await this.assertShortcutFree(input.shortcut, id);
    return this.db.client.quickReply.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    await this.db.client.quickReply.delete({ where: { id } });
    return { deleted: true };
  }

  private async getOrThrow(id: string) {
    const qr = await this.db.client.quickReply.findUnique({ where: { id } });
    if (!qr) throw new NotFoundException("Quick reply not found");
    return qr;
  }

  private async assertShortcutFree(shortcut: string, exceptId?: string) {
    const existing = await this.db.client.quickReply.findFirst({ where: { shortcut } });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`Shortcut ${shortcut} already exists`);
    }
  }
}
