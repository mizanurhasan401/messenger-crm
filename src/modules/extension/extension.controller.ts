import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Permission } from '../../common/enums/permission.enum';
import {
  ExtensionCustomerSyncDto,
  ExtensionNoteDto,
  ExtensionOrderDto,
} from './dto/extension.dto';
import { ExtensionService } from './extension.service';

/**
 * Chrome Extension integration API.
 *
 * Auth: the extension authenticates with the logged-in user's bearer JWT, so
 * the organization (tenant) is derived from the token — the same isolation
 * path as the rest of the app. (Per-org static API keys can be layered in via
 * ExtensionApiKeyGuard for headless usage.)
 */
@ApiTags('Extension')
@ApiBearerAuth()
@Controller('extension')
export class ExtensionController {
  constructor(private readonly extension: ExtensionService) {}

  @Post('customer-sync')
  @RequirePermissions(Permission.CUSTOMER_CREATE)
  @ResponseMessage('Customer synced')
  @ApiOperation({ summary: 'Upsert a customer from a Messenger conversation' })
  syncCustomer(@Body() dto: ExtensionCustomerSyncDto) {
    return this.extension.syncCustomer(dto);
  }

  @Post('note')
  @RequirePermissions(Permission.NOTE_MANAGE)
  @ResponseMessage('Note added')
  @ApiOperation({ summary: 'Add a note to a customer by Facebook id' })
  addNote(@Body() dto: ExtensionNoteDto) {
    return this.extension.addNote(dto);
  }

  @Post('order')
  @RequirePermissions(Permission.ORDER_CREATE)
  @ResponseMessage('Order created')
  @ApiOperation({ summary: 'Create an order for a customer by Facebook id' })
  createOrder(@Body() dto: ExtensionOrderDto) {
    return this.extension.createOrder(dto);
  }
}
