import { z } from "zod";

import {
  ASSIGNABLE_STAFF_ROLES,
  MEMBERSHIP_STATUS_OPTIONS,
  STAFF_INVITE_ROLES,
  TIMEZONE_OPTIONS,
} from "@/features/admin/constants";

export const clinicSettingsSchema = z.object({
  name: z.string().trim().min(2, "Clinic name is required").max(120),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  timezone: z.enum(TIMEZONE_OPTIONS),
  isActive: z.boolean(),
  aiAssistEnabled: z.boolean(),
});

export const inviteStaffSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  role: z.enum(STAFF_INVITE_ROLES),
});

export const updateMembershipSchema = z.object({
  membershipId: z.string().min(1),
  role: z.enum(ASSIGNABLE_STAFF_ROLES).optional(),
  status: z.enum(MEMBERSHIP_STATUS_OPTIONS).optional(),
});

export type ClinicSettingsInput = z.infer<typeof clinicSettingsSchema>;
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;
