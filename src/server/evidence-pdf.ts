// The evidence summary PDF sent to PayPal with provide-evidence: the claims, each citing its exhibits,
// and the exhibit list with dates. Plain, legible, one document a PayPal agent can read in a minute.
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type Exhibit = { number: string; label: string; kind: string; date: Date };
type Claim = { text: string; exhibitIds: string[] };

export async function evidencePdf(input: {
  sellerName: string;
  clientName: string;
  saleTitle: string;
  amount: string;
  disputeId: string;
  reason: string;
  claims: Claim[];
  exhibits: (Exhibit & { id: string })[];
  coverLetter: string;
}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.043, 0.071, 0.082);
  const muted = rgb(0.36, 0.39, 0.44);
  const green = rgb(0.059, 0.482, 0.373);
  let page = doc.addPage([612, 792]);
  let y = 740;
  const margin = 64;
  const width = 612 - margin * 2;

  const ensure = (h: number) => {
    if (y - h < 64) {
      page = doc.addPage([612, 792]);
      y = 740;
    }
  };
  const text = (t: string, size = 10.5, f = font, color = ink, gap = 4) => {
    // Helvetica in pdf-lib is WinAnsi only: replace characters it can't encode.
    const safe = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/×/g, "x").replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
    const words = safe.split(/\s+/);
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) > width) {
        ensure(size + gap);
        page.drawText(line, { x: margin, y, size, font: f, color });
        y -= size + gap;
        line = w;
      } else line = next;
    }
    if (line) {
      ensure(size + gap);
      page.drawText(line, { x: margin, y, size, font: f, color });
      y -= size + gap;
    }
  };

  text("Seller response and evidence", 18, bold);
  y -= 4;
  text(`PayPal case ${input.disputeId} - ${input.reason}`, 10, font, muted);
  text(`${input.saleTitle} - ${input.amount} - client: ${input.clientName} - seller: ${input.sellerName}`, 10, font, muted);
  y -= 10;
  text(input.coverLetter, 11);
  y -= 8;
  text("What the evidence shows", 13, bold);
  const byId = Object.fromEntries(input.exhibits.map((e) => [e.id, e]));
  input.claims.forEach((c, i) => {
    text(`${i + 1}. ${c.text}`, 11);
    text(`   See exhibit ${c.exhibitIds.map((id) => byId[id]?.number).filter(Boolean).join(", ")}`, 10, bold, green);
    y -= 4;
  });
  y -= 6;
  text("Exhibits", 13, bold);
  for (const e of input.exhibits) text(`${e.number}  ${e.label} (${e.kind}, ${e.date.toISOString().slice(0, 10)})`, 10.5);
  y -= 10;
  text("Prepared with Cleared from the seller's proof locker and approved by the seller before sending.", 9, font, muted);
  return doc.save();
}
