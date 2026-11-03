// Dev database: the newest packet for a client's case, and whether it used the screenshot filed from Ask Cleared.
import { desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
// The sale that most recently got a file from Ask Cleared.
const [filed] = await db.select().from(s.proofs).where(eq(s.proofs.fileName, process.argv[2] ?? "client-approval.png")).orderBy(desc(s.proofs.createdAt)).limit(1);
const sale = (await db.select().from(s.sales).where(eq(s.sales.id, filed.saleId)))[0];
const proofs = await db.select().from(s.proofs).where(eq(s.proofs.saleId, sale.id));
console.log("locker:", proofs.map((p) => `${p.kind}:${p.fileName ?? p.label}${p.text ? ` [text: ${p.text.slice(0, 90)}]` : ""}`).join(" | "));
const [d] = await db.select().from(s.disputes).where(eq(s.disputes.saleId, sale.id));
const [pk] = await db.select().from(s.packets).where(eq(s.packets.disputeId, d.id)).orderBy(desc(s.packets.createdAt)).limit(1);
console.log("packet:", pk?.status, "·", pk?.recommendation);
console.log("rationale:", pk?.rationale);
console.log("claims:", ((pk?.claims as { text: string }[] | null) ?? []).map((c, i) => `${i + 1}. ${c.text}`).join(" | "));
console.log("missing:", JSON.stringify(pk?.missingEvidence));
process.exit(0);
