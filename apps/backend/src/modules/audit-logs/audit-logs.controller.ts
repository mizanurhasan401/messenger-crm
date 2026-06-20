import { Controller, Get, Query } from "@nestjs/common";
import { paginationQuerySchema, Role } from "@messenger/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuditLogsService } from "./audit-logs.service";

@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogs: AuditLogsService) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Get()
  list(@Query() query: unknown) {
    const parsed = paginationQuerySchema.parse(query);
    const entityType = (query as { entityType?: string }).entityType;
    return this.auditLogs.list({ ...parsed, entityType });
  }
}
