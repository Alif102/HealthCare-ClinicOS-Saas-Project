import { z } from "zod";

import {
  INVOICE_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "@/features/billing/constants";

const moneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount (e.g. 75.00)")
  .refine((value) => Number(value) >= 0, "Amount cannot be negative")
  .refine((value) => Number(value) <= 999999.99, "Amount is too large");

export const invoiceFormSchema = z
  .object({
    patientProfileId: z.string().min(1, "Select a patient"),
    appointmentId: z.string().optional().or(z.literal("")),
    subtotal: moneyString,
    tax: moneyString.optional().or(z.literal("")),
    currency: z
      .string()
      .trim()
      .min(3, "Use a 3-letter currency code")
      .max(3, "Use a 3-letter currency code"),
    dueAt: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (value) =>
          !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
        "Use YYYY-MM-DD",
      ),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const subtotal = Number(value.subtotal);
    const tax = value.tax && value.tax !== "" ? Number(value.tax) : 0;
    if (subtotal + tax <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Invoice total must be greater than zero",
        path: ["subtotal"],
      });
    }
  });

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(INVOICE_STATUS_OPTIONS),
});

export const recordPaymentSchema = z.object({
  amount: moneyString.refine((value) => Number(value) > 0, "Amount must be > 0"),
  method: z.enum(PAYMENT_METHOD_OPTIONS),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  paidAt: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) =>
        !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Use YYYY-MM-DD",
    ),
});

export type InvoiceFormInput = z.infer<typeof invoiceFormSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
