import { z } from "zod";

export const appointmentIdSchema = z.object({
  appointmentId: z.string().min(1),
});

export const sessionIdSchema = z.object({
  sessionId: z.string().min(1),
});

export type AppointmentIdInput = z.infer<typeof appointmentIdSchema>;
export type SessionIdInput = z.infer<typeof sessionIdSchema>;
