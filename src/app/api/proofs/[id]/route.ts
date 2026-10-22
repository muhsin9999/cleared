import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { currentSeller } from "@/server/auth";
import { fileUrl, isStatic, readFile } from "@/server/storage";

// Opens one private proof file for its seller through a five-minute link; ?download=1 saves it instead.
export async function GET(request: Request, ctx: RouteContext<"/api/proofs/[id]">) {
  const seller = await currentSeller();
  if (!seller) return new Response("Sign in again.", { status: 401 });
  const { id } = await ctx.params;
  const proof = await db.query.proofs.findFirst({ where: eq(s.proofs.id, id), with: { sale: { columns: { sellerId: true } } } });
  if (!proof?.fileKey || proof.sale.sellerId !== seller.id) return new Response("Not found.", { status: 404 });
  const name = proof.fileName ?? "proof";
  if (new URL(request.url).searchParams.has("download")) {
    if (isStatic(proof.fileKey)) {
      return new Response(Buffer.from(await readFile(proof.fileKey)), { headers: { "Content-Type": proof.mimeType ?? "application/octet-stream", "Content-Disposition": `attachment; filename="${name.replace(/"/g, "")}"` } });
    }
    return new Response(null, { status: 302, headers: { Location: await fileUrl(proof.fileKey, name, true) } });
  }
  // A relative Location works for the demo files served from /public; R2 links are absolute.
  return new Response(null, { status: 302, headers: { Location: await fileUrl(proof.fileKey, proof.fileName ?? undefined) } });
}
