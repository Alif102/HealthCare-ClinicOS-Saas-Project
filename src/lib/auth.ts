import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db";

const authSecret = process.env.AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET;
const authUrl =
  process.env.AUTH_URL ??
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL;

if (!authSecret) {
  throw new Error("Missing AUTH_SECRET (or BETTER_AUTH_SECRET) in environment.");
}

if (!authUrl) {
  throw new Error("Missing AUTH_URL (or BETTER_AUTH_URL / NEXT_PUBLIC_SITE_URL).");
}

/**
 * Better Auth server instance.
 * Roles live on TenantMembership (Phase 1) — not on User alone.
 */
export const auth = betterAuth({
  appName: "ClinicOS",
  secret: authSecret,
  baseURL: authUrl,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? {
          google: {
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          },
        }
      : {}),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
    additionalFields: {
      activeTenantId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const tenant = await prisma.tenant.findUnique({
            where: { slug: "demo-clinic" },
          });

          if (!tenant) return;

          await prisma.tenantMembership.create({
            data: {
              tenantId: tenant.id,
              userId: user.id,
              role: "PATIENT",
              status: "ACTIVE",
            },
          });

          await prisma.patientProfile.create({
            data: {
              tenantId: tenant.id,
              userId: user.id,
            },
          });
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const membership = await prisma.tenantMembership.findFirst({
            where: {
              userId: session.userId,
              status: "ACTIVE",
            },
            orderBy: { createdAt: "asc" },
          });

          return {
            data: {
              ...session,
              activeTenantId: membership?.tenantId ?? null,
            },
          };
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
