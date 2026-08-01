export const siteConfig = {
  name: "ClinicOS",
  description:
    "Multi-tenant clinic operating system — appointments, patients, prescriptions, billing, telehealth, and role-based care teams.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  github:
    "https://github.com/Alif102/HealthCare-ClinicOS-Saas-Project",
  live: "https://getclinicos.vercel.app",
} as const;
