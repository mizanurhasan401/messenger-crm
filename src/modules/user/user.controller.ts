import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  @RequirePermissions(Permission.USER_MANAGE)
  @ApiOperation({ summary: 'List users in the organization' })
  @ApiPaginatedResponse()
  list(@Query() query: PaginationQueryDto) {
    return this.users.list(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.USER_MANAGE)
  @ApiOperation({ summary: 'Get a user by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.USER_MANAGE)
  @ResponseMessage('User updated')
  @ApiOperation({ summary: 'Update a user profile' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Patch(':id/role')
  @RequirePermissions(Permission.USER_MANAGE)
  @ResponseMessage('Role updated')
  @ApiOperation({ summary: 'Change a user role (RBAC)' })
  changeRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserRoleDto) {
    return this.users.changeRole(id, dto);
  }
}
