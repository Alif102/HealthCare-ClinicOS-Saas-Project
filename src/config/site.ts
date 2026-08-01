export const siteConfig = {
  name: "ClinicOS",
  description:
    "Modern clinic operating system for appointments, patients, prescriptions, and care teams.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
