import { z } from "zod";

export const GENDER_OPTIONS = [
  "MALE",
  "FEMALE",
  "OTHER",
  "UNSPECIFIED",
] as const;

export const BLOOD_TYPE_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
] as const;

export const patientProfileSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  dateOfBirth: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      "Enter a valid date",
    ),
  gender: z.enum(GENDER_OPTIONS),
  bloodType: z.string().trim().max(16).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  emergencyContactName: z.string().trim().max(80).optional().or(z.literal("")),
  emergencyContactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export const createPatientSchema = patientProfileSchema.extend({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export type PatientProfileInput = z.infer<typeof patientProfileSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
