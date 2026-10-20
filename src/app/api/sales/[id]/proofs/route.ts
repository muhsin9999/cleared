import { randomUUID } from "node:crypto";
import { and, eq, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema as s } from "@/db";
import { checkEvidenceFile, MAX_CASE_BYTES } from "@/lib/evidence-files";
import { currentSeller } from "@/server/auth";
import { putFile } from "@/server/storage";

// Uploads one delivered file into the sale's proof locker (F3). Same limits PayPal applies to evidence.
export async function POST(request: Request, ctx: RouteContext<"/api/sales/[id]/proofs">) {
  const seller = await currentSeller();
  if (!seller) return Response.json({ error: "Sign in again." }, { status: 401 });
  const { id } = await ctx.params;
  const sale = await db.query.sales.findFirst({ where: and(eq(s.sales.id, id), eq(s.sales.sellerId, seller.id)) });
  if (!sale) return Response.json({ error: "Sale not found." }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a file to upload." }, { status: 400 });
  const problem = checkEvidenceFile(file);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  const [{ total }] = await db.select({ total: sum(s.proofs.sizeBytes) }).from(s.proofs).where(eq(s.proofs.saleId, sale.id));
  if (Number(total ?? 0) + file.size > MAX_CASE_BYTES) return Response.json({ error: "PayPal accepts at most 50 MB of evidence per case. Remove a file first." }, { status: 400 });

  const safeName = file.name.replace(/[^\w.\-]+/g, "-").slice(-120) || "file";
  const key = `sales/${sale.id}/${randomUUID()}-${safeName}`;
  try {
    await putFile(key, new Uint8Array(await file.arrayBuffer()), file.type);
  } catch {
    return Response.json({ error: "Storage didn’t accept the file. Try again; nothing was saved." }, { status: 502 });
  }
  const label = typeof form?.get("label") === "string" && (form.get("label") as string).trim() ? (form.get("label") as string).trim().slice(0, 120) : "Delivered file";
  const [proof] = await db.insert(s.proofs).values({ saleId: sale.id, kind: "file", label, fileKey: key, fileName: file.name.slice(0, 200), mimeType: file.type, sizeBytes: file.size }).returning();
  await db.insert(s.events).values({ sellerId: seller.id, saleId: sale.id, source: "cleared", type: "PROOF.FILE_ADDED", summary: `${file.name} added to the proof locker`, verified: true });
  if (sale.status === "paid") await db.update(s.sales).set({ status: "delivered", deliveredAt: new Date() }).where(eq(s.sales.id, sale.id));
  revalidatePath(`/sales/${sale.id}`);
  return Response.json({ ok: true, id: proof.id });
}
