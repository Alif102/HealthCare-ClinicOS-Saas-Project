export const DEMO_PASSWORD = "DemoPass123!";

export const demoAccounts = [
  {
    role: "Admin",
    email: "admin@demo-clinic.local",
    focus: "Tenant settings, team, and clinic-wide oversight",
  },
  {
    role: "Receptionist",
    email: "reception@demo-clinic.local",
    focus: "Scheduling, check-in flow, and billing desk",
  },
  {
    role: "Doctor",
    email: "doctor@demo-clinic.local",
    focus: "Encounters, prescriptions, and video visits",
  },
  {
    role: "Patient",
    email: "patient@demo-clinic.local",
    focus: "Own appointments, Rx history, and invoices",
  },
] as const;

export type DemoAccount = (typeof demoAccounts)[number];
