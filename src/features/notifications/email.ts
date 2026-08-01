import { Resend } from "resend";

import { siteConfig } from "@/config/site";

/**
 * Optional Resend client. Without RESEND_API_KEY, email channel is a no-op
 * so ThemeForest demos still work on in-app notifications alone.
 */
export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function getFromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "ClinicOS <onboarding@resend.dev>"
  );
}

export async function sendNotificationEmail(input: {
  to: string;
  title: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: input.to,
      subject: `[${siteConfig.name}] ${input.title}`,
      text: `${input.body}\n\n— ${siteConfig.name}`,
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email send failed",
    };
  }
}
