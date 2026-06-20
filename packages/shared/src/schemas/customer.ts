import { z } from "zod";
import { addressSchema, paginationQuerySchema } from "./common";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: addressSchema.optional().nullable(),
  fbName: z.string().trim().max(150).optional().nullable(),
  fbProfileUrl: z.string().url().optional().nullable(),
  source: z.string().max(50).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const customerQuerySchema = paginationQuerySchema.extend({
  tag: z.string().max(40).optional(),
  hasOrders: z.coerce.boolean().optional(),
});
export type CustomerQuery = z.infer<typeof customerQuerySchema>;

export const addTagSchema = z.object({
  label: z.string().trim().min(1).max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});
export type AddTagInput = z.infer<typeof addTagSchema>;
