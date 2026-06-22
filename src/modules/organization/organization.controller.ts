import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

@ApiTags('Organization')
@ApiBearerAuth()
@Controller('organization')
export class OrganizationController {
  constructor(private readonly orgs: OrganizationService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current organization' })
  getCurrent() {
    return this.orgs.getCurrent();
  }

  @Patch()
  @RequirePermissions(Permission.ORG_MANAGE)
  @ResponseMessage('Organization updated')
  @ApiOperation({ summary: 'Update the current organization' })
  update(@Body() dto: UpdateOrganizationDto) {
    return this.orgs.updateCurrent(dto);
  }
}
