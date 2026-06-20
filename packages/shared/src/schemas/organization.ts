import { z } from "zod";
import { Role } from "../enums";

const roleEnum = z.nativeEnum(Role);

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and hyphens only")
    .optional(),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  logoUrl: z.string().url().optional().nullable(),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: roleEnum.refine((r) => r !== Role.OWNER, "cannot invite as OWNER"),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: roleEnum,
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
