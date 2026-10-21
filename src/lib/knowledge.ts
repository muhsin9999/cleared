// PayPal's published rules the AI may cite (docs/KNOWLEDGE.md, checked 19 Oct 2026). Paraphrased, with sources.
export const RULES = [
  { id: "K1", topic: "holds new sellers", text: "New sellers, and sellers returning after a gap, may have initial payments held for up to 21 days to cover possible buyer complaints.", url: "https://www.paypal.com/us/cshelp/article/HELP848" },
  { id: "K2", topic: "holds release review", text: "PayPal reviews monthly whether proceeds can be released immediately; positive selling history and confirmed identity speed this up.", url: "https://www.paypal.com/us/cshelp/article/HELP848" },
  { id: "K3", topic: "instant release factors", text: "Instant release depends on a confirmed bank or card, a confirmed primary phone, enough sales, no disputes for a period and no active limitation.", url: "https://www.paypal.com/us/cshelp/article/HELP848" },
  { id: "K4", topic: "release goods tracking", text: "For goods, add tracking from an approved carrier; the hold releases about 24 hours after the carrier confirms delivery.", url: "https://www.paypal.com/us/cshelp/article/help129" },
  { id: "K5", topic: "release services completed", text: "For services or intangible items, mark the order Completed; the hold releases 7 days later.", url: "https://www.paypal.com/us/cshelp/article/help129" },
  { id: "K8", topic: "limitation causes", text: "Limitations can follow higher-risk activity such as many claims or chargebacks, a new product category or a sudden sales spike.", url: "https://www.paypal.com/us/cshelp/article/why-is-my-paypal-account-limited-help534" },
  { id: "K10", topic: "phishing resolution center", text: "A genuine limitation notice also appears in the Resolution Center; if it does not, forward the email to phishing@paypal.com.", url: "https://www.paypal.com/us/cshelp/article/why-is-my-paypal-account-limited-help534" },
  { id: "K11", topic: "closure 180 days", text: "When PayPal ends service, the balance is held for 180 days and the decision can't be overturned.", url: "https://www.paypal.com/us/cshelp/article/were-unable-to-continue-offering-our-services-pcc191" },
  { id: "K13", topic: "reserves factors", text: "Reserves weigh processing history, claim and dispute volume, preselling and extended delivery timeframes.", url: "https://www.paypal.com/us/brc/article/account-reserves" },
  { id: "K14", topic: "reserves advice", text: "PayPal advises shipping promptly with valid tracking, communicating early, keeping complaints under 1% of sales and refunding promptly.", url: "https://www.paypal.com/us/brc/article/account-reserves" },
  { id: "K15", topic: "dispute deadline", text: "Respond to a dispute within 10 days of creation, or an escalated claim may be decided for the buyer; the dispute's own response due date is the real deadline.", url: "https://developer.paypal.com/docs/disputes/" },
  { id: "K18", topic: "acceptable use restricted prohibited items categories", text: "PayPal's Acceptable Use Policy prohibits or restricts some products and services; selling them can lead to limitation or account closure.", url: "https://www.paypal.com/us/legalhub/paypal/acceptableuse-full" },
  { id: "K16", topic: "seller protection intangible services", text: "US Seller Protection covers tangible goods shipped to the transaction address; digital goods and services are generally not covered, so for services the proof is everything.", url: "https://www.paypal.com/us/legalhub/paypal/useragreement-full" },
] as const;

export type RuleId = (typeof RULES)[number]["id"];

export function searchRules(query: string, limit = 4) {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  return RULES.map((r) => ({ r, score: words.filter((w) => `${r.topic} ${r.text}`.toLowerCase().includes(w)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.r);
}
