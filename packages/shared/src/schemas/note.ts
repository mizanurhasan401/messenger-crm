import { z } from "zod";
import { NotableType } from "../enums";

export const createNoteSchema = z
  .object({
    notableType: z.nativeEnum(NotableType),
    customerId: z.string().optional().nullable(),
    orderId: z.string().optional().nullable(),
    body: z.string().trim().min(1).max(4000),
    isInternal: z.boolean().default(false),
  })
  .superRefine((val, ctx) => {
    if (val.notableType === NotableType.CUSTOMER && !val.customerId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "customerId required", path: ["customerId"] });
    }
    if (val.notableType === NotableType.ORDER && !val.orderId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "orderId required", path: ["orderId"] });
    }
  });
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  isInternal: z.boolean().optional(),
});
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
