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
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { NoteService } from './note.service';

@ApiTags('Notes')
@ApiBearerAuth()
@Controller('notes')
export class NoteController {
  constructor(private readonly notes: NoteService) {}

  @Post()
  @RequirePermissions(Permission.NOTE_MANAGE)
  @ResponseMessage('Note added')
  @ApiOperation({ summary: 'Add a note to a customer' })
  create(@Body() dto: CreateNoteDto) {
    return this.notes.create(dto);
  }

  @Get('customer/:customerId')
  @RequirePermissions(Permission.CUSTOMER_READ)
  @ApiOperation({ summary: "Get a customer's note history" })
  listByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.notes.listByCustomer(customerId);
  }

  @Patch(':id')
  @RequirePermissions(Permission.NOTE_MANAGE)
  @ResponseMessage('Note updated')
  @ApiOperation({ summary: 'Update a note' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNoteDto) {
    return this.notes.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.NOTE_MANAGE)
  @ResponseMessage('Note deleted')
  @ApiOperation({ summary: 'Delete a note' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.notes.remove(id);
    return null;
  }
}
