import Link from "next/link";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { siteConfig } from "@/config/site";
import {
  getActiveMembership,
  requireSession,
} from "@/lib/auth-session";
import { cn } from "@/lib/utils";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const membership = await getActiveMembership(
    session.user.id,
    session.session.activeTenantId,
  );

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/appointments", label: "Appointments" },
    { href: "/prescriptions", label: "Prescriptions" },
    { href: "/doctors", label: "Doctors" },
    ...(membership?.role === "PATIENT"
      ? [{ href: "/patients/me", label: "My profile" }]
      : [{ href: "/patients", label: "Patients" }]),
    ...(membership?.role === "DOCTOR"
      ? [{ href: "/doctors/me", label: "My doctor profile" }]
      : []),
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-semibold tracking-[0.14em] text-teal-800 uppercase"
            >
              {siteConfig.name}
            </Link>
            <nav className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn("hover:text-foreground")}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs sm:block">
              <p className="font-medium text-foreground">{session.user.name}</p>
              <p className="text-muted-foreground">
                {membership?.role ?? "MEMBER"} ·{" "}
                {membership?.tenant.name ?? "No clinic"}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
