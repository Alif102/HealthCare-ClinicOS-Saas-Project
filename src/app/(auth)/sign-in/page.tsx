import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your clinic workspace securely."
    >
      <SignInForm />
    </AuthShell>
  );
}
