import { z } from "zod";

export const createQuickReplySchema = z.object({
  title: z.string().trim().min(1).max(80),
  shortcut: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^\/[a-z0-9-]+$/, "must start with / and use lowercase letters/numbers/hyphens"),
  content: z.string().trim().min(1).max(2000),
});
export type CreateQuickReplyInput = z.infer<typeof createQuickReplySchema>;

export const updateQuickReplySchema = createQuickReplySchema.partial();
export type UpdateQuickReplyInput = z.infer<typeof updateQuickReplySchema>;
