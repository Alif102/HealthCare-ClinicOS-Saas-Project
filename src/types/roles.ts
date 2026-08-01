/**
 * Clinic membership roles (Phase 1 lock). Auth wiring lands in Phase 4.
 */
export const ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR", "PATIENT"] as const;

export type Role = (typeof ROLES)[number];
