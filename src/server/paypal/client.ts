// Minimal typed PayPal REST client (sandbox by default). Ported from scripts/spikes/paypal.mjs.
import "server-only";
import "@/lib/net";

const BASE = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
let cached: { value: string; exp: number } | undefined;

export class PayPalError extends Error {
  constructor(public status: number, public debugId: string | null, public body: unknown, message: string) {
    super(message);
  }
}

async function token() {
  if (cached && cached.exp > Date.now()) return cached.value;
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const body = (await res.json()) as { access_token: string; expires_in: number };
  if (!res.ok) throw new PayPalError(res.status, res.headers.get("paypal-debug-id"), body, "PayPal sign-in failed");
  cached = { value: body.access_token, exp: Date.now() + (body.expires_in - 60) * 1000 };
  return cached.value;
}

export async function paypal<T = unknown>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, init: { body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const message = (json as { message?: string } | null)?.message ?? `PayPal ${method} ${path} failed`;
    throw new PayPalError(res.status, res.headers.get("paypal-debug-id"), json, message);
  }
  return json as T;
}

/** Multipart POST (used by Disputes provide-evidence). */
export async function paypalMultipart<T = unknown>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers: { Authorization: `Bearer ${await token()}` }, body: form, cache: "no-store" });
  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const details = (json as { details?: { issue?: string; description?: string }[]; message?: string } | null) ?? {};
    throw new PayPalError(res.status, res.headers.get("paypal-debug-id"), json, details.details?.[0]?.description ?? details.details?.[0]?.issue ?? details.message ?? `PayPal POST ${path} failed`);
  }
  return json as T;
}
