import { AI_DISCLAIMER } from "@/features/ai/constants";
import type { AiProviderId } from "@/features/ai/constants";

type AiDisclaimerProps = {
  provider?: AiProviderId;
  className?: string;
};

export function AiDisclaimer({ provider, className }: AiDisclaimerProps) {
  return (
    <p className={className ?? "text-xs text-muted-foreground"}>
      {AI_DISCLAIMER}
      {provider ? (
        <>
          {" "}
          Provider: <span className="font-medium text-foreground">{provider}</span>
          .
        </>
      ) : null}
    </p>
  );
}
