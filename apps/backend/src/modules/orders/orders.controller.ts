import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  changeOrderStatusSchema,
  ChangeOrderStatusInput,
  createOrderSchema,
  CreateOrderInput,
  orderQuerySchema,
  Role,
  updateOrderSchema,
  UpdateOrderInput,
} from "@messenger/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodBody } from "../../common/pipes/zod-validation.pipe";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.orders.list(orderQuerySchema.parse(query));
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.orders.get(id);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Post()
  create(@CurrentUser() userId: string, @Body(new ZodBody(createOrderSchema)) dto: CreateOrderInput) {
    return this.orders.create(userId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Patch(":id")
  update(@Param("id") id: string, @Body(new ZodBody(updateOrderSchema)) dto: UpdateOrderInput) {
    return this.orders.update(id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Patch(":id/status")
  changeStatus(
    @Param("id") id: string,
    @CurrentUser() userId: string,
    @Body(new ZodBody(changeOrderStatusSchema)) dto: ChangeOrderStatusInput,
  ) {
    return this.orders.changeStatus(id, userId, dto);
  }
}
