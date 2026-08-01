import Link from "next/link";

import { siteConfig } from "@/config/site";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-full flex-1 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_oklch(0.94_0.03_200),_transparent_50%),linear-gradient(160deg,_oklch(0.99_0.01_200),_oklch(0.96_0.02_180))]"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="mb-8 space-y-2">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.18em] text-teal-800 uppercase"
          >
            {siteConfig.name}
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/85 p-6 shadow-sm backdrop-blur">
          {children}
        </div>
      </div>
    </main>
  );
}
