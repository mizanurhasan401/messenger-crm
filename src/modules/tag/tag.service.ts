import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { AttachTagDto, CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { TagRepository } from './tag.repository';

@Injectable()
export class TagService {
  constructor(private readonly repo: TagRepository) {}

  create(dto: CreateTagDto): Promise<Tag> {
    return this.repo.create(dto);
  }

  findAll(): Promise<Tag[]> {
    return this.repo.findAll();
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    await this.getOrThrow(id);
    await this.repo.update(id, dto);
    return this.getOrThrow(id);
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.repo.delete(id);
  }

  async attach(tagId: string, dto: AttachTagDto): Promise<void> {
    await this.getOrThrow(tagId);
    const customer = await this.repo.customerInOrg(dto.customerId);
    if (!customer) throw new BadRequestException('Customer not found in your organization');
    await this.repo.attach(dto.customerId, tagId);
  }

  async detach(tagId: string, dto: AttachTagDto): Promise<void> {
    await this.getOrThrow(tagId);
    await this.repo.detach(dto.customerId, tagId);
  }

  private async getOrThrow(id: string): Promise<Tag> {
    const tag = await this.repo.findById(id);
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }
}
