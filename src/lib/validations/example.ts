import { z } from "zod";

/**
 * Example shared schema pattern for Phase 2.
 * Real domain schemas live next to their feature modules.
 */
export const contactNameSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
});

export type ContactNameInput = z.infer<typeof contactNameSchema>;
