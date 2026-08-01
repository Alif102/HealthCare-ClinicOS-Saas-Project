import type { MembershipStatus, Role } from "@prisma/client";

export const STAFF_INVITE_ROLES = ["ADMIN", "RECEPTIONIST"] as const satisfies readonly Role[];

export type StaffInviteRole = (typeof STAFF_INVITE_ROLES)[number];

export const MEMBERSHIP_STATUS_OPTIONS = [
  "ACTIVE",
  "INVITED",
  "SUSPENDED",
] as const satisfies readonly MembershipStatus[];

export const MEMBERSHIP_STATUS_LABEL: Record<MembershipStatus, string> = {
  ACTIVE: "Active",
  INVITED: "Invited",
  SUSPENDED: "Suspended",
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  RECEPTIONIST: "Receptionist",
  DOCTOR: "Doctor",
  PATIENT: "Patient",
};

/** Roles an admin may assign on the team page (staff only). */
export const ASSIGNABLE_STAFF_ROLES = [
  "ADMIN",
  "RECEPTIONIST",
] as const satisfies readonly Role[];

export const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
] as const;
