import { z } from "zod";
import { FollowupStatus } from "../enums";
import { paginationQuerySchema } from "./common";

export const createFollowupSchema = z.object({
  customerId: z.string().min(1),
  assignedTo: z.string().min(1).optional(),
  dueAt: z.coerce.date(),
  note: z.string().max(1000).optional(),
});
export type CreateFollowupInput = z.infer<typeof createFollowupSchema>;

export const updateFollowupSchema = z.object({
  dueAt: z.coerce.date().optional(),
  assignedTo: z.string().min(1).optional(),
  note: z.string().max(1000).optional(),
  status: z.nativeEnum(FollowupStatus).optional(),
});
export type UpdateFollowupInput = z.infer<typeof updateFollowupSchema>;

export const followupQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(FollowupStatus).optional(),
  scope: z.enum(["upcoming", "completed", "all"]).default("upcoming"),
  assignedTo: z.string().optional(),
});
export type FollowupQuery = z.infer<typeof followupQuerySchema>;
