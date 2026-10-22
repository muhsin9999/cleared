"use server";

import { and, count, eq, isNotNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema as s } from "@/db";
import { readNotice, type Locker, type NoticeResult, type ResolutionCenterAnswer } from "@/lib/notice";
import { randomUUID } from "node:crypto";
import { MAX_FILE_BYTES } from "@/lib/evidence-files";
import { polishReply, transcribeNotice } from "../ai/notice";
import { requireSeller, type Seller } from "../auth";
import { putFile } from "../storage";

export type NoticeFormState = { error?: string };

async function lockerCounts(sellerId: string): Promise<Locker> {
  const proofs = await db
    .select({ kind: s.proofs.kind, n: count() })
    .from(s.proofs)
    .innerJoin(s.sales, eq(s.sales.id, s.proofs.saleId))
    .where(eq(s.sales.sellerId, sellerId))
    .groupBy(s.proofs.kind);
  const by = Object.fromEntries(proofs.map((p) => [p.kind, p.n])) as Record<string, number>;
  const [inv] = await db
    .select({ sent: count(), withTerms: sql<number>`count(*) filter (where ${s.invoices.draft}->>'terms' is not null)::int` })
    .from(s.invoices)
    .innerJoin(s.sales, eq(s.sales.id, s.invoices.saleId))
    .where(and(eq(s.sales.sellerId, sellerId), isNotNull(s.invoices.sentAt)));
  return { invoices: inv.sent, deliveredFiles: by.file ?? 0, acceptances: by.acceptance ?? 0, tracking: by.tracking ?? 0, messages: by.message ?? 0, terms: inv.withTerms };
}

/** Plain draft reply from the requirements map. The AI pass (docs/AI.md J3) will rewrite this; it never adds facts. */
function draftReply(seller: Seller, r: ReturnType<typeof readNotice>, locker: Locker) {
  if (r.verdict === "likely_phishing") return null;
  const who = seller.businessName ? `${seller.name} of ${seller.businessName}` : seller.name;
  const what = { service: "services", digital: "commissioned digital artwork", physical: "physical goods", other: "freelance work" }[seller.sells];
  const ready = r.requirements.filter((q) => q.status === "ready");
  const yours = r.requirements.filter((q) => q.status === "you");
  const lines = [
    "Hello,",
    "",
    `I’m ${who}. I sell ${what} to clients through PayPal invoices. Thank you for reviewing my account; here is the information you asked for.`,
    "",
    ...(ready.length ? ["Attached:", ...ready.map((q) => `- ${q.label}: ${q.key === "invoices" ? `${locker.invoices} invoices` : q.key === "fulfilment" ? `${locker.deliveredFiles} delivered files and ${locker.acceptances} client confirmations of receipt` : q.help}`), ""] : []),
    ...(yours.length ? [`I’m also uploading my ${yours.map((q) => q.label.toLowerCase()).join(", ")} here in the Resolution Center.`, ""] : []),
    "Each payment was for work I delivered, and my clients confirmed receipt. I’m happy to provide anything else you need.",
    "",
    `${seller.name}`,
  ];
  return lines.join("\n");
}

export async function submitNotice(_prev: NoticeFormState, form: FormData): Promise<NoticeFormState> {
  const seller = await requireSeller();
  let text = String(form.get("text") ?? "").trim();
  const rc = String(form.get("rc") ?? "") as ResolutionCenterAnswer;
  const file = form.get("file");
  if (!["yes", "no", "unsure"].includes(rc)) return { error: "Answer the Resolution Center question first." };

  // A screenshot or PDF: the AI transcribes it (sender and links exactly as shown), then the same rules run.
  let fileKey: string | null = null;
  let transcribed = false;
  let senderVisible = true;
  if (file instanceof File && file.size > 0 && !text) {
    if (!["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"].includes(file.type)) return { error: "Upload a screenshot (PNG, JPG, GIF, WebP) or a PDF." };
    if (file.size > MAX_FILE_BYTES) return { error: "That file is over 10 MB. Try a smaller screenshot." };
    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      const t = await transcribeNotice(seller.id, { type: file.type, bytes, name: file.name });
      if (!t.isEmail) return { error: "That doesn’t look like an email or a PayPal notice. Try a clearer screenshot." };
      text = t.text;
      transcribed = true;
      senderVisible = t.senderVisible;
    } catch {
      return { error: "Cleared couldn’t read that file. Paste the email text instead." };
    }
    fileKey = `notices/${seller.id}/${randomUUID()}-${file.name.replace(/[^\w.-]+/g, "-").slice(-80)}`;
    await putFile(fileKey, bytes, file.type).catch(() => (fileKey = null));
  }
  if (text.length < 40) return { error: "Paste the whole email, including the “From:” line, or upload a screenshot." };

  const locker = await lockerCounts(seller.id);
  const r = readNotice(text, rc, locker);
  if (transcribed && !senderVisible && r.verdict !== "likely_phishing")
    r.signals.push({ id: "sender-hidden", strength: "weak", text: "The screenshot doesn’t show the sender’s address. Check it in your inbox before trusting the email." });
  const plain = draftReply(seller, r, locker);
  let reply = plain;
  let replySource: "ai" | "plain" = "plain";
  if (plain) {
    // Only facts that answer what PayPal asked for; the plain draft already carries the relevant counts.
    const facts = { seller: seller.name, business: seller.businessName, sells: seller.sells, requested: r.requirements.map((q) => ({ item: q.label, status: q.status === "ready" ? "attached" : q.status === "you" ? "seller uploads it in PayPal" : "missing" })) };
    const polished = await polishReply(seller.id, plain, facts).catch(() => null);
    if (polished) {
      reply = polished;
      replySource = "ai";
    }
  }
  const result: NoticeResult = { ...r, draftReply: reply, replySource, transcribed };
  const [row] = await db
    .insert(s.notices)
    .values({ sellerId: seller.id, sourceText: text.slice(0, 20_000), fileKey, inResolutionCenter: rc, verdict: r.verdict, result: result as unknown as Record<string, unknown> })
    .returning({ id: s.notices.id });
  await db.insert(s.events).values({
    sellerId: seller.id,
    source: "cleared",
    type: r.verdict === "likely_phishing" ? "NOTICE.PHISHING_SUSPECTED" : "NOTICE.READ",
    summary: r.verdict === "likely_phishing" ? "A “PayPal” email looks like phishing: don’t click its links" : `PayPal ${r.type === "unknown" ? "notice" : r.type} read: ${r.requirements.length} things requested`,
    verified: true,
  });
  revalidatePath("/cases");
  redirect(`/notices/${row.id}`);
}

export async function markNoticeDone(noticeId: string) {
  const seller = await requireSeller();
  await db.update(s.notices).set({ doneAt: new Date() }).where(and(eq(s.notices.id, noticeId), eq(s.notices.sellerId, seller.id)));
  revalidatePath(`/notices/${noticeId}`);
  revalidatePath("/cases");
}
