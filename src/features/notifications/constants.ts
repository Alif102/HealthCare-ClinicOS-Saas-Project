export const NOTIFICATION_EVENT = {
  APPOINTMENT_BOOKED: "appointment.booked",
  APPOINTMENT_STATUS: "appointment.status",
  INVOICE_ISSUED: "invoice.issued",
  INVOICE_PAID: "invoice.paid",
  PRESCRIPTION_ISSUED: "prescription.issued",
  VIDEO_ROOM_READY: "video.room_ready",
} as const;

export type NotificationEvent =
  (typeof NOTIFICATION_EVENT)[keyof typeof NOTIFICATION_EVENT];

export const NOTIFICATION_EVENT_LABEL: Record<NotificationEvent, string> = {
  [NOTIFICATION_EVENT.APPOINTMENT_BOOKED]: "Appointment booked",
  [NOTIFICATION_EVENT.APPOINTMENT_STATUS]: "Appointment update",
  [NOTIFICATION_EVENT.INVOICE_ISSUED]: "Invoice issued",
  [NOTIFICATION_EVENT.INVOICE_PAID]: "Payment recorded",
  [NOTIFICATION_EVENT.PRESCRIPTION_ISSUED]: "Prescription issued",
  [NOTIFICATION_EVENT.VIDEO_ROOM_READY]: "Video room ready",
};
