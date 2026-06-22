import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { AuditAction } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { Permission } from '../../common/enums/permission.enum';
import { AuditLogService } from './audit-log.service';

@ApiTags('Audit Log')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly audit: AuditLogService) {}

  @Get()
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'List audit logs for the organization' })
  @ApiQuery({ name: 'action', enum: AuditAction, required: false })
  @ApiPaginatedResponse()
  list(@Query() query: PaginationQueryDto, @Query('action') action?: AuditAction) {
    return this.audit.list(query, action);
  }
}
