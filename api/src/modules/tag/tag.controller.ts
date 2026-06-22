import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { AttachTagDto, CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { TagService } from './tag.service';

@ApiTags('Tags')
@ApiBearerAuth()
@Controller('tags')
export class TagController {
  constructor(private readonly tags: TagService) {}

  @Post()
  @RequirePermissions(Permission.TAG_MANAGE)
  @ResponseMessage('Tag created')
  @ApiOperation({ summary: 'Create a tag' })
  create(@Body() dto: CreateTagDto) {
    return this.tags.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.CUSTOMER_READ)
  @ApiOperation({ summary: 'List tags' })
  findAll() {
    return this.tags.findAll();
  }

  @Patch(':id')
  @RequirePermissions(Permission.TAG_MANAGE)
  @ResponseMessage('Tag updated')
  @ApiOperation({ summary: 'Update a tag' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTagDto) {
    return this.tags.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.TAG_MANAGE)
  @ResponseMessage('Tag deleted')
  @ApiOperation({ summary: 'Delete a tag' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.tags.remove(id);
    return null;
  }

  @Post(':id/attach')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.TAG_MANAGE)
  @ResponseMessage('Tag attached')
  @ApiOperation({ summary: 'Attach a tag to a customer' })
  async attach(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AttachTagDto) {
    await this.tags.attach(id, dto);
    return null;
  }

  @Post(':id/detach')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.TAG_MANAGE)
  @ResponseMessage('Tag detached')
  @ApiOperation({ summary: 'Detach a tag from a customer' })
  async detach(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AttachTagDto) {
    await this.tags.detach(id, dto);
    return null;
  }
}
