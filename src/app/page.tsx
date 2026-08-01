"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const stack = [
  "Next.js App Router",
  "Better Auth",
  "Prisma + Neon",
  "shadcn/ui",
  "Redux Toolkit",
  "React Hook Form + Zod",
] as const;

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.96_0.02_220),_transparent_55%),linear-gradient(to_bottom,_oklch(0.99_0.005_220),_oklch(0.97_0.01_200))]"
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <p className="text-sm font-semibold tracking-[0.18em] text-teal-800 uppercase">
            {siteConfig.name}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Clinic operations, unified
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Phase 4 unlocks authentication — email/password, Google OAuth, tenant
            memberships, and a protected dashboard shell.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/sign-in" className={cn(buttonVariants())}>
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Create account
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          <Card className="border-border/60 bg-background/80 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Foundation stack</CardTitle>
              <CardDescription>
                Demo users are seeded after Phase 4 — see docs for credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {stack.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border/70 bg-muted/40 px-3 py-2 text-sm"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
