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
  const body = readJson(await res.text(), res, "POST", "/v1/oauth2/token") as { access_token: string; expires_in: number };
  if (!res.ok) throw new PayPalError(res.status, res.headers.get("paypal-debug-id"), body, "PayPal sign-in failed");
  cached = { value: body.access_token, exp: Date.now() + (body.expires_in - 60) * 1000 };
  return cached.value;
}

/** Parses a PayPal reply; a cut-off or non-JSON body becomes a PayPalError naming the call, not a bare SyntaxError. */
function readJson(text: string, res: Response, method: string, path: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new PayPalError(res.ok ? 502 : res.status, res.headers.get("paypal-debug-id"), text.slice(0, 200), `PayPal ${method} ${path} sent an unreadable reply`);
  }
}

const RETRYABLE = (e: unknown) => !(e instanceof PayPalError) || e.status === 429 || e.status >= 500;

export async function paypal<T = unknown>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, init: { body?: unknown; rawBody?: string; headers?: Record<string, string> } = {}): Promise<T> {
  // A read is safe to repeat: one retry after a moment rides out a sandbox blip (a cut-off reply failed the dispute
  // sync on 28 Oct 2026). Writes are never repeated here; their outcome would be unknown.
  if (method === "GET") {
    try {
      return await paypalOnce<T>(method, path, init);
    } catch (e) {
      if (!RETRYABLE(e)) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return paypalOnce<T>(method, path, init);
}

async function paypalOnce<T>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, init: { body?: unknown; rawBody?: string; headers?: Record<string, string> }): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers },
    body: init.rawBody ?? (init.body === undefined ? undefined : JSON.stringify(init.body)),
    cache: "no-store",
  });
  const text = await res.text();
  const json = readJson(text, res, method, path);
  if (!res.ok) {
    const err = json as { message?: string; details?: { field?: string; issue?: string; description?: string }[] } | null;
    const detail = err?.details?.[0];
    const message = [err?.message ?? `PayPal ${method} ${path} failed`, detail ? `(${[detail.field, detail.issue ?? detail.description].filter(Boolean).join(": ")})` : null].filter(Boolean).join(" ");
    throw new PayPalError(res.status, res.headers.get("paypal-debug-id"), json, message);
  }
  return json as T;
}

/** Multipart POST (used by Disputes provide-evidence). */
export async function paypalMultipart<T = unknown>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers: { Authorization: `Bearer ${await token()}` }, body: form, cache: "no-store" });
  const text = await res.text();
  const json = readJson(text, res, "POST", path);
  if (!res.ok) {
    const details = (json as { details?: { issue?: string; description?: string }[]; message?: string } | null) ?? {};
    throw new PayPalError(res.status, res.headers.get("paypal-debug-id"), json, details.details?.[0]?.description ?? details.details?.[0]?.issue ?? details.message ?? `PayPal POST ${path} failed`);
  }
  return json as T;
}
