import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  @ApiPaginatedResponse()
  list(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.notifications.list(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async unreadCount(@CurrentUser('id') userId: string) {
    return { count: await this.notifications.unreadCount(userId) };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Marked as read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    await this.notifications.markRead(id, userId);
    return null;
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('All marked as read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser('id') userId: string) {
    await this.notifications.markAllRead(userId);
    return null;
  }
}
