import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { LandingPage } from "@/features/marketing/components/landing-page";

export const metadata: Metadata = {
  title: {
    absolute: `${siteConfig.name} — Clinic operating system`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} — Clinic operating system`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function HomePage() {
  return <LandingPage />;
}
