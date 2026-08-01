import { createAuthClient } from "better-auth/react";

/**
 * Use same-origin `/api/auth` (no absolute NEXT_PUBLIC_SITE_URL).
 * Hardcoding http://localhost:3000 breaks when another process owns :3000
 * and `next dev` binds to :3001 — browser gets Failed to fetch / CORS.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
