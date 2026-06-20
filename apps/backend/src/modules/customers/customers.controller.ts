import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import {
  addTagSchema,
  AddTagInput,
  createCustomerSchema,
  CreateCustomerInput,
  customerQuerySchema,
  Role,
  updateCustomerSchema,
  UpdateCustomerInput,
} from "@messenger/shared";
import type { Response } from "express";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodBody } from "../../common/pipes/zod-validation.pipe";
import type { TenantContext } from "../../common/context/tenant-context";
import { CustomersService } from "./customers.service";

@Controller("customers")
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.customers.list(customerQuerySchema.parse(query));
  }

  @Get("export")
  async export(@Res() res: Response) {
    const csv = await this.customers.exportCsv();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="customers.csv"');
    res.send(csv);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.customers.get(id);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Post()
  create(
    @CurrentUser() userId: string,
    @Body(new ZodBody(createCustomerSchema)) dto: CreateCustomerInput,
  ) {
    return this.customers.create(userId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Post("import")
  import(@CurrentOrg() ctx: TenantContext, @Body() body: { csv: string }) {
    return this.customers.importCsv(ctx.orgId, ctx.userId, body.csv);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Patch(":id")
  update(@Param("id") id: string, @Body(new ZodBody(updateCustomerSchema)) dto: UpdateCustomerInput) {
    return this.customers.update(id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.customers.remove(id);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Post(":id/tags")
  addTag(@Param("id") id: string, @Body(new ZodBody(addTagSchema)) dto: AddTagInput) {
    return this.customers.addTag(id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Delete("tags/:tagId")
  removeTag(@Param("tagId") tagId: string) {
    return this.customers.removeTag(tagId);
  }
}
