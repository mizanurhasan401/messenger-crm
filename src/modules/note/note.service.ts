import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Note } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { NoteRepository } from './note.repository';

@Injectable()
export class NoteService {
  constructor(
    private readonly repo: NoteRepository,
    private readonly tenant: TenantContext,
  ) {}

  async create(dto: CreateNoteDto): Promise<Note> {
    const customer = await this.repo.customerInOrg(dto.customerId);
    if (!customer) throw new BadRequestException('Customer not found in your organization');
    return this.repo.create({
      customerId: dto.customerId,
      content: dto.content,
      authorId: this.tenant.userId,
    });
  }

  listByCustomer(customerId: string) {
    return this.repo.listByCustomer(customerId);
  }

  async update(id: string, dto: UpdateNoteDto): Promise<Note> {
    await this.getOrThrow(id);
    await this.repo.update(id, dto.content);
    return this.getOrThrow(id);
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.repo.delete(id);
  }

  private async getOrThrow(id: string): Promise<Note> {
    const note = await this.repo.findById(id);
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }
}
