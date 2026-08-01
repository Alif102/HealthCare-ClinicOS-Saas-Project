"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Receipt,
  Shield,
  Sparkles,
  Video,
  BarChart3,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  DEMO_PASSWORD,
  demoAccounts,
} from "@/features/marketing/demo-accounts";
import { ProductPreview } from "@/features/marketing/components/product-preview";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Appointments",
    body: "Slot-aware scheduling across doctors, with role-scoped lists and status transitions.",
    icon: CalendarDays,
  },
  {
    title: "Patients & history",
    body: "Demographics, encounters, and longitudinal chart views under tenant isolation.",
    icon: ClipboardList,
  },
  {
    title: "Prescriptions",
    body: "Doctor-authored Rx with patient-safe read paths and edit lifecycle.",
    icon: FileText,
  },
  {
    title: "Billing",
    body: "Invoices, payment recording, and patient-visible balances.",
    icon: Receipt,
  },
  {
    title: "Video visits",
    body: "Telehealth rooms tied to appointments for remote consults.",
    icon: Video,
  },
  {
    title: "AI assist",
    body: "Local-first clinical helpers for notes and draft support.",
    icon: Sparkles,
  },
  {
    title: "Reports",
    body: "Daily volume and operational snapshots for clinic leads.",
    icon: BarChart3,
  },
  {
    title: "Roles & tenancy",
    body: "Better Auth sessions with Admin, Receptionist, Doctor, and Patient memberships.",
    icon: Shield,
  },
] as const;

const stack = [
  "Next.js App Router",
  "TypeScript",
  "Prisma + PostgreSQL",
  "Better Auth",
  "Tailwind + shadcn/ui",
  "Zod + RHF",
  "Vitest",
  "Vercel + Neon",
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

function demoSignInHref(email: string) {
  const params = new URLSearchParams({
    email,
    password: DEMO_PASSWORD,
  });
  return `/sign-in?${params.toString()}`;
}

export function LandingPage() {
  const reduceMotion = useReducedMotion();
  const fadeUp = reduceMotion
    ? { initial: false, animate: undefined }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <div className="flex flex-1 flex-col bg-[#f4faf9] text-slate-900">
      <header className="relative z-10 border-b border-teal-900/8 bg-[#f4faf9]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-teal-950"
          >
            {siteConfig.name}
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-teal-900/70",
              )}
            >
              GitHub
            </a>
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ size: "sm" }), "bg-teal-900 text-teal-50 hover:bg-teal-800")}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — one composition */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(45,212,191,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(15,118,110,0.12),_transparent_50%),linear-gradient(180deg,#f4faf9_0%,#e8f5f3_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f766e' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 sm:pt-20 sm:pb-12 lg:pt-24">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.55, ease }}
              className="max-w-2xl"
            >
              <p className="text-4xl font-semibold tracking-tight text-teal-950 sm:text-5xl lg:text-6xl">
                {siteConfig.name}
              </p>
              <h1 className="mt-4 max-w-xl text-xl font-medium leading-snug text-teal-900/80 sm:text-2xl">
                Clinic operations, unified end to end.
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-teal-900/55 sm:text-lg">
                A production-shaped multi-tenant SaaS for appointments, charts,
                prescriptions, billing, and telehealth — built to show how a
                real clinic stack comes together.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#demo"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-teal-900 px-4 text-teal-50 hover:bg-teal-800",
                  )}
                >
                  Try a demo role
                </Link>
                <Link
                  href="/sign-up"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-teal-900/15 bg-white/60 px-4 text-teal-950 hover:bg-white",
                  )}
                >
                  Create account
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.15, duration: 0.65, ease }}
          >
            <ProductPreview />
          </motion.div>
        </section>

        {/* Capabilities */}
        <section className="border-b border-teal-900/8 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, ease }}
            >
              <h2 className="text-2xl font-semibold tracking-tight text-teal-950 sm:text-3xl">
                What ships in the product
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-teal-900/55">
                Domain modules with authz, Prisma queries, and App Router pages —
                not a thin UI shell.
              </p>
            </motion.div>

            <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.li
                    key={feature.title}
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      delay: reduceMotion ? 0 : index * 0.04,
                      duration: 0.4,
                      ease,
                    }}
                    className="space-y-3"
                  >
                    <Icon
                      className="size-5 text-teal-700"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <h3 className="text-base font-semibold text-teal-950">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-teal-900/55">
                      {feature.body}
                    </p>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Demo roles — interactive */}
        <section id="demo" className="scroll-mt-16 bg-[#f4faf9]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, ease }}
            >
              <h2 className="text-2xl font-semibold tracking-tight text-teal-950 sm:text-3xl">
                Sign in as a seeded role
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-teal-900/55">
                Shared password for every demo account:{" "}
                <code className="rounded-md bg-teal-900/6 px-1.5 py-0.5 font-mono text-sm text-teal-900">
                  {DEMO_PASSWORD}
                </code>
                . Pick a role — email and password prefill on the sign-in form.
              </p>
            </motion.div>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {demoAccounts.map((account, index) => (
                <motion.li
                  key={account.email}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    delay: reduceMotion ? 0 : index * 0.05,
                    duration: 0.4,
                    ease,
                  }}
                >
                  <Link
                    href={demoSignInHref(account.email)}
                    className="group flex h-full flex-col rounded-xl border border-teal-900/10 bg-white p-5 transition-colors hover:border-teal-800/25 hover:bg-teal-50/40"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-lg font-semibold text-teal-950">
                        {account.role}
                      </span>
                      <span className="text-xs font-medium text-teal-700 opacity-0 transition-opacity group-hover:opacity-100">
                        Open sign-in →
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-teal-900/55">
                      {account.focus}
                    </p>
                    <code className="mt-4 block truncate font-mono text-xs text-teal-800/70">
                      {account.email}
                    </code>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        {/* Stack */}
        <section className="border-t border-teal-900/8 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, ease }}
            >
              <h2 className="text-2xl font-semibold tracking-tight text-teal-950 sm:text-3xl">
                How it&apos;s built
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-teal-900/55">
                App Router server components and actions, typed Prisma access,
                and unit tests on money, slots, transitions, and providers.
              </p>
            </motion.div>

            <ul className="mt-10 flex flex-wrap gap-2">
              {stack.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-teal-900/10 bg-[#f4faf9] px-3 py-2 text-sm text-teal-900/80"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-teal-900/10 bg-teal-950 text-teal-50/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-semibold text-teal-50">{siteConfig.name}</p>
            <p className="mt-1 text-sm text-teal-100/50">
              Portfolio healthcare SaaS · open source on GitHub
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal-50"
            >
              Source
            </a>
            <a
              href={siteConfig.live}
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal-50"
            >
              Live demo
            </a>
            <Link href="/sign-in" className="hover:text-teal-50">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
