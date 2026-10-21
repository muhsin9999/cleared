import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { ensureDraft } from "@/server/workflows";
import { ingest, verifySignature, type WebhookEvent } from "@/server/paypal/webhooks";

// PayPal webhook receiver. Every delivery is checked with PayPal's verify-webhook-signature before it is
// stored; unverified deliveries are logged for Settings > Webhook health and never touch a sale.
export async function POST(request: Request) {
  const raw = await request.text();
  let event: WebhookEvent;
  try {
    event = JSON.parse(raw) as WebhookEvent;
  } catch {
    await log(null, "INVALID_JSON", "rejected", "Body is not JSON");
    return Response.json({ ok: false }, { status: 400 });
  }

  let verification: string;
  let reason: string | null = null;
  try {
    ({ status: verification, reason } = await verifySignature(request.headers, event));
  } catch (e) {
    // PayPal itself didn't answer: ask it to retry later rather than drop the event.
    await log(event, "ERROR", "retry", (e as Error).message);
    return Response.json({ ok: false }, { status: 503 });
  }
  if (verification !== "SUCCESS") {
    await log(event, verification, "rejected", reason ?? "PayPal did not confirm the signature");
    return Response.json({ ok: false }, { status: 400 });
  }

  const outcome = await ingest(event);
  await log(event, verification, outcome, null);
  if (outcome === "stored" && event.event_type === "CUSTOMER.DISPUTE.CREATED") {
    const id = (event.resource as { dispute_id?: string }).dispute_id;
    const dispute = id ? await db.query.disputes.findFirst({ where: eq(s.disputes.paypalDisputeId, id), columns: { id: true } }) : null;
    if (dispute) await ensureDraft(dispute.id);
  }
  if (outcome === "stored") revalidatePath("/", "layout");
  return Response.json({ ok: true, outcome });
}

async function log(event: WebhookEvent | null, verification: string, outcome: string, error: string | null) {
  await db.insert(s.webhookDeliveries).values({ paypalEventId: event?.id ?? null, type: event?.event_type ?? null, verification, outcome, error });
}
