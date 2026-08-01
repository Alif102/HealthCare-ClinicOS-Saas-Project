import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const reportRangeSchema = z
  .object({
    from: isoDate,
    to: isoDate,
    doctorProfileId: z.string().min(1).optional(),
  })
  .refine((value) => value.from <= value.to, {
    message: "From date must be on or before to date",
    path: ["from"],
  });

export type ReportRangeInput = z.infer<typeof reportRangeSchema>;
