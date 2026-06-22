import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { UpdateSubscriptionDto } from './dto/subscription.dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('Subscription')
@ApiBearerAuth()
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptions: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current subscription' })
  getCurrent() {
    return this.subscriptions.getCurrent();
  }

  @Patch()
  @RequirePermissions(Permission.BILLING_MANAGE)
  @ResponseMessage('Subscription updated')
  @ApiOperation({ summary: 'Update plan / seats' })
  update(@Body() dto: UpdateSubscriptionDto) {
    return this.subscriptions.update(dto);
  }
}
