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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import {
  AssignCustomerDto,
  ChangeCustomerStatusDto,
  UpdateCustomerDto,
} from './dto/update-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomerController {
  constructor(private readonly customers: CustomerService) {}

  @Post()
  @RequirePermissions(Permission.CUSTOMER_CREATE)
  @ResponseMessage('Customer created')
  @ApiOperation({ summary: 'Create a customer' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customers.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.CUSTOMER_READ)
  @ApiOperation({ summary: 'List customers (search, filters, pagination)' })
  @ApiPaginatedResponse()
  findAll(@Query() query: QueryCustomerDto) {
    return this.customers.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.CUSTOMER_READ)
  @ApiOperation({ summary: 'Get a customer by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customers.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.CUSTOMER_UPDATE)
  @ResponseMessage('Customer updated')
  @ApiOperation({ summary: 'Update a customer' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.CUSTOMER_UPDATE)
  @ResponseMessage('Customer status updated')
  @ApiOperation({ summary: 'Change customer status' })
  changeStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeCustomerStatusDto) {
    return this.customers.changeStatus(id, dto);
  }

  @Patch(':id/assign')
  @RequirePermissions(Permission.CUSTOMER_UPDATE)
  @ResponseMessage('Customer assigned')
  @ApiOperation({ summary: 'Assign / unassign an agent' })
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignCustomerDto) {
    return this.customers.assign(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.CUSTOMER_DELETE)
  @ResponseMessage('Customer deleted')
  @ApiOperation({ summary: 'Delete a customer' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.customers.remove(id);
    return null;
  }
}
