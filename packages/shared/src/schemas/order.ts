import { z } from "zod";
import { OrderStatus } from "../enums";
import { paginationQuerySchema } from "./common";

export const orderItemSchema = z.object({
  name: z.string().trim().min(1).max(150),
  qty: z.coerce.number().int().positive(),
  price: z.coerce.number().nonnegative(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const createOrderSchema = z.object({
  customerId: z.string().min(1),
  orderNumber: z.string().trim().max(50).optional(),
  items: z.array(orderItemSchema).min(1),
  shippingFee: z.coerce.number().nonnegative().default(0),
  currency: z.string().length(3).default("BDT"),
  note: z.string().max(2000).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1).optional(),
  shippingFee: z.coerce.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
});
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const changeOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional(),
});
export type ChangeOrderStatusInput = z.infer<typeof changeOrderStatusSchema>;

export const orderQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  customerId: z.string().optional(),
});
export type OrderQuery = z.infer<typeof orderQuerySchema>;
