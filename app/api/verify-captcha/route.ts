import { NextResponse, type NextRequest } from "next/server";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VALID_ACTIONS = new Set(["client-signup", "lawyer-signup"]);

/**
 * POST /api/verify-captcha
 *
 * Body (JSON): { token: string; action: string }
 *
 * Validates the Cloudflare Turnstile token server-side.
 * The secret key is read from TURNSTILE_SECRET (server-only env, never browser).
 * TURNSTILE_HOSTNAMES is a comma-separated list of allowed hostnames.
 *
 * Returns: { success: true } | { success: false; error: string }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    console.error("[verify-captcha] TURNSTILE_SECRET is not set.");
    return NextResponse.json(
      { success: false, error: "Server misconfiguration." },
      { status: 500 }
    );
  }

  // Parse allowed hostnames; must be set per-environment.
  const allowedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean)
  );

  let body: { token?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { token, action } = body;

  // Basic input sanity — prevents oversized tokens from being forwarded.
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048 ||
    typeof action !== "string" ||
    !VALID_ACTIONS.has(action) ||
    allowedHostnames.size === 0
  ) {
    return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  // Canonical siteverify call — always server-to-Cloudflare, never browser-to-Cloudflare.
  const clientIp =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";

  let result: { success: boolean; action?: string; hostname?: string; "error-codes"?: string[] };
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret,
        response: token,
        ...(clientIp ? { remoteip: clientIp } : {}),
      }),
    });
    if (!res.ok) throw new Error(`siteverify HTTP ${res.status}`);
    result = await res.json();
  } catch (err) {
    console.error("[verify-captcha] siteverify fetch failed:", err);
    return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  // Require: success, matching action, and an approved frontend hostname.
  if (
    !result.success ||
    result.action !== action ||
    !result.hostname ||
    !allowedHostnames.has(result.hostname)
  ) {
    console.warn("[verify-captcha] Token rejected:", {
      success: result.success,
      returnedAction: result.action,
      expectedAction: action,
      hostname: result.hostname,
      errorCodes: result["error-codes"],
    });
    return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
