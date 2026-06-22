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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { ChangeOrderStatusDto, UpdateOrderDto } from './dto/update-order.dto';
import { OrderService } from './order.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Post()
  @RequirePermissions(Permission.ORDER_CREATE)
  @ResponseMessage('Order created')
  @ApiOperation({ summary: 'Create an order' })
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.ORDER_READ)
  @ApiOperation({ summary: 'List orders (filters + pagination)' })
  @ApiPaginatedResponse()
  findAll(@Query() query: QueryOrderDto) {
    return this.orders.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.ORDER_READ)
  @ApiOperation({ summary: 'Get an order by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ORDER_UPDATE)
  @ResponseMessage('Order updated')
  @ApiOperation({ summary: 'Update an order' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderDto) {
    return this.orders.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.ORDER_UPDATE)
  @ResponseMessage('Order status updated')
  @ApiOperation({ summary: 'Change order status' })
  changeStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeOrderStatusDto) {
    return this.orders.changeStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.ORDER_DELETE)
  @ResponseMessage('Order deleted')
  @ApiOperation({ summary: 'Delete an order' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.orders.remove(id);
    return null;
  }
}
