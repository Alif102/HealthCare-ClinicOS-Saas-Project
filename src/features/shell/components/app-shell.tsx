"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Menu,
  Receipt,
  Shield,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  Video,
  X,
} from "lucide-react";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  getAppNavItems,
  resolveActiveHref,
  type NavItem,
} from "@/features/shell/nav-items";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/roles";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  calendar: CalendarDays,
  "file-text": FileText,
  stethoscope: Stethoscope,
  users: Users,
  "user-round": UserRound,
  "bar-chart": BarChart3,
  receipt: Receipt,
  video: Video,
  sparkles: Sparkles,
  shield: Shield,
  bell: Bell,
} as const;

type AppShellProps = {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  role: Role | undefined;
  clinicName: string;
  unreadCount: number;
};

function NavLinks({
  items,
  activeHref,
  onNavigate,
}: {
  items: NavItem[];
  activeHref: string | null;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5 px-3" aria-label="Main">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-teal-900 text-teal-50"
                : "text-teal-950/70 hover:bg-teal-900/6 hover:text-teal-950",
            )}
          >
            <Icon className="size-4 shrink-0 opacity-80" strokeWidth={1.75} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  items,
  activeHref,
  userName,
  role,
  clinicName,
  onNavigate,
}: {
  items: NavItem[];
  activeHref: string | null;
  userName: string;
  role: Role | undefined;
  clinicName: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-teal-900/8 px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="text-sm font-semibold tracking-tight text-teal-950"
        >
          {siteConfig.name}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <p className="mb-2 px-5 text-[11px] font-semibold tracking-[0.14em] text-teal-900/40 uppercase">
          Workspace
        </p>
        <NavLinks items={items} activeHref={activeHref} onNavigate={onNavigate} />
      </div>

      <div className="border-t border-teal-900/8 p-4">
        <div className="rounded-lg bg-teal-900/[0.04] px-3 py-2.5">
          <p className="truncate text-sm font-medium text-teal-950">{userName}</p>
          <p className="mt-0.5 truncate text-xs text-teal-900/50">
            {role ?? "MEMBER"} · {clinicName}
          </p>
        </div>
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  userName,
  userEmail,
  role,
  clinicName,
  unreadCount,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = getAppNavItems(role, unreadCount);
  const activeHref = resolveActiveHref(pathname, items);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-full flex-1 bg-[#f6faf9]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-r border-teal-900/8 bg-white md:block lg:w-64">
        <SidebarBody
          items={items}
          activeHref={activeHref}
          userName={userName}
          role={role}
          clinicName={clinicName}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-teal-950/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-white shadow-xl">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute top-3 right-3 rounded-lg p-2 text-teal-900/60 hover:bg-teal-900/5"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" />
            </button>
            <SidebarBody
              items={items}
              activeHref={activeHref}
              userName={userName}
              role={role}
              clinicName={clinicName}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-teal-900/8 bg-white/90 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-teal-900/70 hover:bg-teal-900/5 md:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-teal-950 md:hidden">
              {siteConfig.name}
            </p>
            <p className="hidden truncate text-sm text-teal-900/55 md:block">
              {clinicName}
              <span className="mx-1.5 text-teal-900/25">·</span>
              {userEmail}
            </p>
          </div>
          {unreadCount > 0 ? (
            <Link
              href="/notifications"
              className="rounded-lg bg-teal-900/6 px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-900/10"
            >
              {unreadCount} alert{unreadCount === 1 ? "" : "s"}
            </Link>
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
