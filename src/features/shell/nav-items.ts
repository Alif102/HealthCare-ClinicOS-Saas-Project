import type { Role } from "@/types/roles";

export type NavItem = {
  href: string;
  label: string;
  icon:
    | "layout-dashboard"
    | "calendar"
    | "file-text"
    | "stethoscope"
    | "users"
    | "user-round"
    | "bar-chart"
    | "receipt"
    | "video"
    | "sparkles"
    | "shield"
    | "bell";
};

export function getAppNavItems(
  role: Role | undefined,
  unreadCount: number,
): NavItem[] {
  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
    { href: "/appointments", label: "Appointments", icon: "calendar" },
    { href: "/prescriptions", label: "Prescriptions", icon: "file-text" },
    { href: "/doctors", label: "Doctors", icon: "stethoscope" },
  ];

  if (role === "PATIENT") {
    items.push({ href: "/patients/me", label: "My profile", icon: "user-round" });
  } else {
    items.push({ href: "/patients", label: "Patients", icon: "users" });
  }

  if (role === "DOCTOR") {
    items.push({
      href: "/doctors/me",
      label: "My doctor profile",
      icon: "user-round",
    });
  }

  if (role && role !== "PATIENT") {
    items.push({ href: "/reports", label: "Reports", icon: "bar-chart" });
  }

  if (role === "ADMIN" || role === "RECEPTIONIST" || role === "PATIENT") {
    items.push({ href: "/billing", label: "Billing", icon: "receipt" });
  }

  items.push({ href: "/video", label: "Video", icon: "video" });

  if (role === "DOCTOR") {
    items.push({ href: "/ai", label: "AI Assist", icon: "sparkles" });
  }

  if (role === "ADMIN") {
    items.push({ href: "/admin", label: "Admin", icon: "shield" });
  }

  items.push({
    href: "/notifications",
    label: unreadCount > 0 ? `Alerts (${unreadCount})` : "Alerts",
    icon: "bell",
  });

  return items;
}

export function resolveActiveHref(pathname: string, items: NavItem[]): string | null {
  const matches = items.filter(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
}
