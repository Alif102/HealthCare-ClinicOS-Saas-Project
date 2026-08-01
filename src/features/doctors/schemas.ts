import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const doctorProfileSchema = z.object({
  specialty: z.string().trim().min(2, "Specialty is required").max(120),
  licenseNumber: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  consultationFee: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => value === undefined || value === "" || !Number.isNaN(Number(value)),
      "Enter a valid fee",
    ),
  isAcceptingPatients: z.boolean(),
});

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  specialty: z.string().trim().min(2, "Specialty is required").max(120),
  licenseNumber: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  consultationFee: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => value === undefined || value === "" || !Number.isNaN(Number(value)),
      "Enter a valid fee",
    ),
});

export const availabilitySchema = z
  .object({
    dayOfWeek: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    startTime: z.string().regex(timeRegex, "Use HH:MM (24h)"),
    endTime: z.string().regex(timeRegex, "Use HH:MM (24h)"),
    slotMinutes: z.number().int().min(5).max(240),
    isActive: z.boolean(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type DoctorProfileInput = z.infer<typeof doctorProfileSchema>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
