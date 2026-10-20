// Notice reader (F7), rule-based part. Reads a pasted PayPal email: phishing signals first, then what PayPal
// asks for. Rule ids refer to docs/KNOWLEDGE.md. The AI pass (docs/AI.md J3) only ever adds to this.

export type ResolutionCenterAnswer = "yes" | "no" | "unsure";
export type Signal = { id: string; strength: "strong" | "weak" | "reassuring"; text: string };
export type NoticeType = "limitation" | "hold" | "reserve" | "closure" | "documents" | "unknown";
export type RequirementKey = "identity" | "address" | "business" | "invoices" | "fulfilment" | "tracking" | "communication" | "policies" | "funds" | "supplier";

export const REQUIREMENTS: Record<RequirementKey, { label: string; where: "locker" | "seller"; help: string; pattern: RegExp }> = {
  identity: { label: "Proof of identity", where: "seller", help: "Upload your ID only inside PayPal. Never send it by email.", pattern: /\b(photo id|government[- ]issued|passport|driver'?s licen[cs]e|identity|identification|national id)\b/i },
  address: { label: "Proof of address", where: "seller", help: "A recent utility bill or bank statement, uploaded inside PayPal.", pattern: /\b(proof of address|utility bill|residential address)\b/i },
  business: { label: "Business details", where: "seller", help: "What you sell, your website or portfolio, and any registration you have.", pattern: /\b(business (registration|license|information|details|model)|nature of (your )?business|website|ein|tax id)\b/i },
  invoices: { label: "Invoices or receipts", where: "locker", help: "Your PayPal invoices for these sales.", pattern: /\b(invoices?|receipts?|proof of (purchase|sale))\b/i },
  fulfilment: { label: "Proof you delivered", where: "locker", help: "Delivered files and the client's confirmation of receipt.", pattern: /\b(proof of (delivery|fulfil?ment|service)|delivered|delivery confirmation|completed (work|services?)|fulfil?ment)\b/i },
  tracking: { label: "Shipment tracking", where: "locker", help: "Carrier and tracking numbers for goods.", pattern: /\b(tracking (number|information|details)|shipping (information|details)|carrier)\b/i },
  communication: { label: "Messages with your client", where: "locker", help: "The brief or agreement the client confirmed.", pattern: /\b(communications?|correspondence|messages|agreement|contract)\b/i },
  policies: { label: "Refund and delivery terms", where: "locker", help: "The terms on your invoices.", pattern: /\b(refund policy|return policy|terms (and|&) conditions|terms of service)\b/i },
  funds: { label: "Bank statement or source of funds", where: "seller", help: "Upload inside PayPal if asked.", pattern: /\b(bank statements?|source of funds)\b/i },
  supplier: { label: "Supplier invoices", where: "seller", help: "For resold goods: where you buy your stock.", pattern: /\b(supplier|wholesale|inventory|purchase invoices?)\b/i },
};

const PAYPAL_HOST = /(^|\.)paypal\.(com|me)$/i;

function senderDomain(text: string) {
  const from = text.match(/^\s*from:\s*(.+)$/im)?.[1] ?? "";
  return from.match(/@([a-z0-9.-]+\.[a-z]{2,})/i)?.[1]?.toLowerCase() ?? null;
}

function linkHosts(text: string) {
  return [...text.matchAll(/https?:\/\/([^\s/<>"')]+)/gi)].map((m) => m[1].toLowerCase().replace(/^www\./, ""));
}

export function phishingSignals(text: string, rc: ResolutionCenterAnswer): Signal[] {
  const out: Signal[] = [];
  const domain = senderDomain(text);
  if (domain && !PAYPAL_HOST.test(domain)) out.push({ id: "sender", strength: "strong", text: `It was sent from @${domain}, not from paypal.com.` });
  if (domain && /paypa[l1i]|pay-pal|pp-/i.test(domain) && !PAYPAL_HOST.test(domain)) out.push({ id: "lookalike", strength: "strong", text: `“${domain}” imitates PayPal’s name.` });
  const badLinks = [...new Set(linkHosts(text).filter((h) => !PAYPAL_HOST.test(h)))];
  if (badLinks.length) out.push({ id: "links", strength: "strong", text: `Links go to ${badLinks.slice(0, 2).join(", ")}${badLinks.length > 2 ? " and more" : ""}, not paypal.com.` });
  if (/\b(password|passcode|pin\b|one[- ]time code|verification code|security code|card number|cvv|social security|ssn|login details)\b/i.test(text))
    out.push({ id: "secrets", strength: "strong", text: "It asks for a password, code or card details. PayPal never asks for these by email." });
  if (/\b(gift ?cards?|bitcoin|crypto|usdt|pay (a|an) (fee|deposit)|unlock fee|activation fee|clearance fee)\b/i.test(text))
    out.push({ id: "fee", strength: "strong", text: "It asks you to pay something to get your money released." });
  if (/\b(anydesk|teamviewer|remote access)\b/i.test(text)) out.push({ id: "remote", strength: "strong", text: "It asks for remote access to your computer." });
  if (/\b(dear (customer|user|member|client|account holder)|dear paypal (user|customer))\b/i.test(text)) out.push({ id: "greeting", strength: "weak", text: "It doesn’t use your name. PayPal’s notices address you by name." });
  if (/\b(within (24|48) hours|immediately|permanently (suspended|closed|deleted)|final (notice|warning)|legal action)\b/i.test(text)) out.push({ id: "urgency", strength: "weak", text: "It pushes you to act within hours or threatens permanent loss." });
  if (/\.(zip|html?|exe|scr)\b/i.test(text) || /\bopen the attach(ed|ment)\b/i.test(text)) out.push({ id: "attachment", strength: "weak", text: "It wants you to open an attachment." });
  if (rc === "no") out.push({ id: "rc-missing", strength: "strong", text: "It isn’t in your Resolution Center. Real limitation notices always appear there too (PayPal rule K10)." });
  if (rc === "yes") out.push({ id: "rc-present", strength: "reassuring", text: "The same message is in your Resolution Center." });
  return out;
}

export function verdict(signals: Signal[]): "likely_phishing" | "genuine" | "unsure" {
  const strong = signals.filter((s) => s.strength === "strong").length;
  const weak = signals.filter((s) => s.strength === "weak").length;
  if (strong >= 1 || weak >= 3) return "likely_phishing";
  return signals.some((s) => s.id === "rc-present") ? "genuine" : "unsure";
}

export function noticeType(text: string): NoticeType {
  if (/\b(no longer (be able to )?(offer|provide)|ended (our|the) (relationship|service)|180 days|permanently limited)\b/i.test(text)) return "closure";
  if (/\breserve\b/i.test(text)) return "reserve";
  if (/\b(limited|limitation|restricted)\b/i.test(text)) return "limitation";
  if (/\b(on hold|held|hold (on|for)|21 days)\b/i.test(text)) return "hold";
  if (/\b(documents?|information) (we need|needed|required)|\bplease (provide|upload|submit)\b/i.test(text)) return "documents";
  return "unknown";
}

export function deadline(text: string, now = new Date()) {
  const days = text.match(/\bwithin (\d{1,2}) (business |calendar )?days\b/i);
  if (days) return { days: Number(days[1]), byDate: new Date(now.getTime() + Number(days[1]) * 86_400_000) };
  const date = text.match(/\bby ((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(, \d{4})?)/i);
  if (date) {
    const parsed = new Date(`${date[1]}${date[3] ? "" : `, ${now.getFullYear()}`}`);
    if (!Number.isNaN(parsed.getTime())) return { days: Math.ceil((parsed.getTime() - now.getTime()) / 86_400_000), byDate: parsed };
  }
  return null;
}

export function requirements(text: string): RequirementKey[] {
  return (Object.keys(REQUIREMENTS) as RequirementKey[]).filter((k) => REQUIREMENTS[k].pattern.test(text));
}

export type Locker = { invoices: number; deliveredFiles: number; acceptances: number; tracking: number; messages: number; terms: number };

export function mapToLocker(keys: RequirementKey[], locker: Locker) {
  return keys.map((key) => {
    const r = REQUIREMENTS[key];
    const have =
      key === "invoices" ? locker.invoices
      : key === "fulfilment" ? locker.deliveredFiles + locker.acceptances
      : key === "tracking" ? locker.tracking
      : key === "communication" ? locker.messages
      : key === "policies" ? locker.terms
      : 0;
    return { key, label: r.label, help: r.help, where: r.where, have, status: r.where === "seller" ? ("you" as const) : have > 0 ? ("ready" as const) : ("missing" as const) };
  });
}

export function readNotice(text: string, rc: ResolutionCenterAnswer, locker: Locker, now = new Date()) {
  const signals = phishingSignals(text, rc);
  const v = verdict(signals);
  const keys = requirements(text);
  return {
    verdict: v,
    signals,
    type: noticeType(text),
    deadline: deadline(text, now),
    requirements: v === "likely_phishing" ? [] : mapToLocker(keys, locker),
  };
}

export type NoticeResult = ReturnType<typeof readNotice> & { draftReply: string | null };
