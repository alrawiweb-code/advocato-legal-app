"use client";

import { Turnstile } from "@marsidev/react-turnstile";

// Real site key loaded from .env.local — NEXT_PUBLIC_ prefix makes it available in the browser.
// Never put TURNSTILE_SECRET here. That lives only in server-side env.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!;

interface CaptchaWidgetProps {
  /** Matches data-action on the widget; must align with server-side siteverify check. */
  action: "client-signup" | "lawyer-signup";
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export function CaptchaWidget({ action, onVerify, onExpire }: CaptchaWidgetProps) {
  return (
    <div className="flex justify-start">
      <Turnstile
        siteKey={SITE_KEY}
        onSuccess={onVerify}
        onExpire={onExpire}
        options={{
          theme: "light",
          size: "normal",
          action, // surfaces logged in Cloudflare dashboard per submission type
        }}
      />
    </div>
  );
}
