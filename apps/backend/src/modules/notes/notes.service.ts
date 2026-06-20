import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateNoteInput, UpdateNoteInput } from "@messenger/shared";
import type { Prisma } from "@messenger/database";
import { TenantPrismaService } from "../../prisma/tenant-prisma.service";

@Injectable()
export class NotesService {
  constructor(private readonly db: TenantPrismaService) {}

  list(params: { customerId?: string; orderId?: string }) {
    const where: Prisma.NoteWhereInput = {};
    if (params.customerId) where.customerId = params.customerId;
    if (params.orderId) where.orderId = params.orderId;
    return this.db.client.note.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  create(userId: string, input: CreateNoteInput) {
    return this.db.client.note.create({
      data: {
        notableType: input.notableType,
        customerId: input.customerId ?? null,
        orderId: input.orderId ?? null,
        body: input.body,
        isInternal: input.isInternal,
        createdBy: userId,
      } as Prisma.NoteUncheckedCreateInput,
    });
  }

  async update(id: string, input: UpdateNoteInput) {
    await this.getOrThrow(id);
    return this.db.client.note.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    await this.db.client.note.delete({ where: { id } });
    return { deleted: true };
  }

  private async getOrThrow(id: string) {
    const note = await this.db.client.note.findUnique({ where: { id } });
    if (!note) throw new NotFoundException("Note not found");
    return note;
  }
}
