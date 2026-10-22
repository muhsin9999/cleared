// The architecture map's single source of truth: every lane, node, connection, journey, trust rule and decision
// on /architecture comes from here. Facts only: file paths are real, numbers are dated and come from evals/.

export const REPO = "https://github.com/muhsin9999/cleared/blob/main";

export type LaneId = "people" | "web" | "workflow" | "ai" | "paypal" | "data";
export type Logo = "paypal" | "render" | "neon" | "cloudflare" | "nextjs" | "openai" | "agent" | "person" | "webhook" | "page" | "clock" | "shield" | "guard" | "send" | "sparkle" | "broom";

export const LANES: { id: LaneId; title: string; blurb: string }[] = [
  { id: "people", title: "People", blurb: "Who uses it" },
  { id: "web", title: "Cleared web", blurb: "Next.js 16 on a Render web service" },
  { id: "workflow", title: "Render Workflow", blurb: "Durable jobs, retries, schedules" },
  { id: "ai", title: "AI", blurb: "The model and the code that checks it" },
  { id: "paypal", title: "PayPal sandbox", blurb: "The APIs Cleared calls and hears from" },
  { id: "data", title: "Data", blurb: "Records and files" },
];

export type ArchNode = {
  id: string;
  lane: LaneId;
  title: string;
  /** One mono line: a route, a function or a model. */
  sub: string;
  logo: Logo;
  summary: string;
  facts: [string, string][];
  source?: string[];
  /** Shown on the Trust lens. */
  trust?: string;
};

export const NODES: ArchNode[] = [
  {
    id: "seller",
    lane: "people",
    title: "Seller",
    sub: "a freelancer, e.g. Ada",
    logo: "person",
    summary: "Checks a sale before invoicing, keeps proof as the work is delivered, and approves every reply before Cleared sends it.",
    facts: [["Signs in", "Demo: one click, a private copy of Ada’s workspace"], ["Approves", "Every evidence submission"]],
  },
  {
    id: "client",
    lane: "people",
    title: "Client",
    sub: "the buyer, on PayPal",
    logo: "person",
    summary: "Pays the PayPal invoice, confirms delivery on Cleared’s confirmation page, and can open a dispute in PayPal.",
    facts: [["Pays", "On PayPal’s own invoice page"], ["Disputes", "In PayPal’s Resolution Center"]],
  },
  {
    id: "app",
    lane: "web",
    title: "Cleared app",
    sub: "Next.js 16 · server actions",
    logo: "nextjs",
    summary: "The seller’s app: the sale check, invoices, the proof locker, cases and approvals. Long jobs go to the Render Workflow; the page streams their steps from the database.",
    facts: [["Runs on", "Render web service, always on"], ["Sale check", "Rule checks plus one AI review, about $0.002"], ["Approval", "Only a seller session can start submitEvidence"]],
    source: ["src/app/(app)", "src/server/actions/cases.ts"],
  },
  {
    id: "webhook",
    lane: "web",
    title: "Webhook receiver",
    sub: "POST /api/paypal/webhook",
    logo: "webhook",
    summary: "Receives PayPal’s events. Each delivery’s signature is checked on the exact bytes PayPal sent, against PayPal’s certificate, before anything is stored. Each event is stored once.",
    facts: [["Checks", "Certificate signature, then PayPal’s verify API as a fallback"], ["Unsigned", "Rejected and logged"], ["Duplicates", "Stored once by PayPal event id"]],
    source: ["src/app/api/paypal/webhook/route.ts", "src/lib/paypal-signature.ts", "src/server/paypal/webhooks.ts"],
    trust: "Signature verified on raw bytes",
  },
  {
    id: "accept",
    lane: "web",
    title: "Client confirmation",
    sub: "/accept/[token]",
    logo: "page",
    summary: "A page the client opens from a private link to confirm they received the work, or to report a problem. Their confirmation becomes an exhibit.",
    facts: [["Records", "Name, time, device and IP address"], ["Becomes", "Proof in the locker"]],
    source: ["src/app/(public)/accept/[token]/actions.ts"],
  },
  {
    id: "draftPacket",
    lane: "workflow",
    title: "Agent · draftPacket",
    sub: "Render Workflow task",
    logo: "agent",
    summary: "Investigates a dispute: writes a plan, opens the evidence with read-only tools, checks PayPal’s rules and drafts a reply where every claim cites an exhibit. Its steps stream to the case screen.",
    facts: [
      ["Runs on", "Render Workflow, 1 retry"],
      ["Model", "gpt-5.4-mini; gpt-5.4 for disputes of $500+"],
      ["Tools", "8, all read-only"],
      ["Evals", "13/13 scenarios passed (22 Oct)"],
      ["Avg time", "10.4 s per case"],
      ["Avg cost", "$0.007 per case"],
    ],
    source: ["src/server/ai/investigate.ts", "src/server/ai/investigator.ts", "evals/README.md"],
    trust: "8 read-only tools · no write access",
  },
  {
    id: "submitEvidence",
    lane: "workflow",
    title: "Submit evidence",
    sub: "submitEvidence task",
    logo: "send",
    summary: "Builds the evidence PDF from the approved reply and the proof files, and sends it to PayPal. It runs only when the seller has approved.",
    facts: [["Runs on", "Render Workflow, 2 retries with backoff"], ["Sends", "A PDF summary plus notes, multipart"], ["Needs", "An approval signed by the seller’s session"]],
    source: ["src/server/paypal/evidence.ts", "src/workflows/main.ts"],
    trust: "Runs only after the seller approves",
  },
  {
    id: "sync",
    lane: "workflow",
    title: "Dispute sync",
    sub: "cron · every 30 min",
    logo: "clock",
    summary: "Pulls new and changed disputes from PayPal and starts the agent on new ones, so a dispute arrives even if a webhook is missed.",
    facts: [["Schedule", "*/30 * * * *"], ["Starts", "draftPacket for each new dispute"]],
    source: ["scripts/sync-disputes.ts", "src/server/paypal/disputes.ts"],
  },
  {
    id: "reset",
    lane: "workflow",
    title: "Nightly reset",
    sub: "cron · 04:00 UTC",
    logo: "broom",
    summary: "Clears old demo workspaces, so every visitor starts from a clean copy.",
    facts: [["Schedule", "0 4 * * *"]],
    source: ["scripts/db.ts"],
  },
  {
    id: "openai",
    lane: "ai",
    title: "OpenAI",
    sub: "Responses API · gpt-5.4-mini",
    logo: "openai",
    summary: "The model behind the agent, the sale check and the notice reader. Strict structured outputs and function tools; every call is in the audit log with its model, tokens and cost.",
    facts: [["Agent", "gpt-5.4-mini, gpt-5.4 for $500+"], ["Sale check", "gpt-5.4-mini, low effort"], ["Audit", "Settings → AI audit log"]],
    source: ["src/server/ai/client.ts", "src/server/ai/preflight.ts", "src/server/ai/notice.ts"],
  },
  {
    id: "claims",
    lane: "ai",
    title: "Claim checker",
    sub: "checkClaims() · code, not a model",
    logo: "shield",
    summary: "Checks every claim the agent wrote: it must cite a real exhibit, and its dates, amounts and file names must match that exhibit. Claims that fail are struck and shown to the seller.",
    facts: [["Struck in evals", "0 of 46 claims (22 Oct)"], ["If none survive", "“Fight” becomes “offer”"]],
    source: ["src/lib/claim-checker.ts"],
    trust: "Strikes claims its exhibits don’t support",
  },
  {
    id: "injection",
    lane: "ai",
    title: "Injection guard",
    sub: "confirmInjections()",
    logo: "guard",
    summary: "Buyer messages and uploaded text are treated as data. The agent reports instructions it refused; code keeps a flag only if the quote really appears in the case and is aimed at the AI.",
    facts: [["Evals", "Injections resisted 3/3 (22 Oct)"]],
    source: ["src/lib/injection.ts"],
    trust: "Ignores instructions hidden in a buyer’s message",
  },
  {
    id: "invoicing",
    lane: "paypal",
    title: "Invoicing v2",
    sub: "/v2/invoicing/invoices",
    logo: "paypal",
    summary: "Cleared creates and sends the PayPal invoice the client pays.",
    facts: [["Calls", "generate-next-invoice-number, create, send, get"]],
    source: ["src/server/paypal/invoicing.ts"],
  },
  {
    id: "disputes",
    lane: "paypal",
    title: "Disputes v1",
    sub: "/v1/customer/disputes",
    logo: "paypal",
    summary: "Where disputes live. Cleared reads them, answers with provide-evidence, and in the sandbox can ask PayPal to decide.",
    facts: [["Calls", "list, get, provide-evidence, adjudicate (sandbox)"]],
    source: ["src/server/paypal/disputes.ts", "src/server/paypal/evidence.ts"],
  },
  {
    id: "events",
    lane: "paypal",
    title: "Webhooks",
    sub: "events + signing certificates",
    logo: "paypal",
    summary: "PayPal sends events (invoice paid, dispute created, updated, resolved) and signs each delivery.",
    facts: [["Events", "INVOICING.INVOICE.PAID/CANCELLED, CUSTOMER.DISPUTE.*, PAYMENT.CAPTURE.COMPLETED"]],
  },
  {
    id: "orders",
    lane: "paypal",
    title: "Orders & Payments v2",
    sub: "createOrderTracking",
    logo: "paypal",
    summary: "Adds shipment tracking to a paid sale, so PayPal releases the hold after delivery. Uses the SDK from APIMatic’s PayPal Context Plugin.",
    facts: [["Calls", "getCapturedPayment, createOrderTracking, getOrder"], ["Contract", "paypal-plan.md"]],
    source: ["src/server/paypal/tracking.ts", "paypal-plan.md"],
    trust: "Claimed before the write; never sent twice",
  },
  {
    id: "neon",
    lane: "data",
    title: "Neon Postgres",
    sub: "sales · proofs · disputes · packets · audit",
    logo: "neon",
    summary: "Every record: sales, the proof locker, disputes, the agent’s steps and replies, PayPal events and the audit log.",
    facts: [["Migrations", "Run by Render before each deploy"]],
    source: ["src/db/schema.ts"],
    trust: "Every AI call and approval in the audit log",
  },
  {
    id: "r2",
    lane: "data",
    title: "Cloudflare R2",
    sub: "proof files",
    logo: "cloudflare",
    summary: "The seller’s delivered files. Workflow tasks fetch them by key; the app streams them through signed links.",
    facts: [["Access", "Signed links; the agent reads names, sizes and dates"]],
    source: ["src/server/storage.ts"],
  },
];

export type ArchEdge = { id: string; from: string; to: string; label: string; kind?: "flow" | "event" | "gate" };

export const EDGES: ArchEdge[] = [
  { id: "seller-app", from: "seller", to: "app", label: "sells, approves" },
  { id: "client-accept", from: "client", to: "accept", label: "confirms delivery" },
  { id: "client-disputes", from: "client", to: "disputes", label: "opens a dispute", kind: "event" },
  { id: "app-invoicing", from: "app", to: "invoicing", label: "create + send invoice" },
  { id: "app-openai", from: "app", to: "openai", label: "sale check" },
  { id: "app-r2", from: "app", to: "r2", label: "upload proof" },
  { id: "app-orders", from: "app", to: "orders", label: "add tracking" },
  { id: "app-submit", from: "app", to: "submitEvidence", label: "seller approves", kind: "gate" },
  { id: "events-webhook", from: "events", to: "webhook", label: "signed events", kind: "event" },
  { id: "webhook-neon", from: "webhook", to: "neon", label: "store verified event" },
  { id: "accept-neon", from: "accept", to: "neon", label: "confirmation record" },
  { id: "sync-disputes", from: "sync", to: "disputes", label: "list + get" },
  { id: "sync-agent", from: "sync", to: "draftPacket", label: "start the agent" },
  { id: "agent-openai", from: "draftPacket", to: "openai", label: "plan + read-only tools" },
  { id: "agent-neon", from: "draftPacket", to: "neon", label: "reads the case, streams steps" },
  { id: "agent-claims", from: "draftPacket", to: "claims", label: "every claim checked" },
  { id: "agent-injection", from: "draftPacket", to: "injection", label: "flags checked in code" },
  { id: "submit-disputes", from: "submitEvidence", to: "disputes", label: "provide-evidence" },
  { id: "submit-r2", from: "submitEvidence", to: "r2", label: "reads files" },
  { id: "app-disputes", from: "app", to: "disputes", label: "adjudicate (sandbox)", kind: "event" },
  { id: "reset-neon", from: "reset", to: "neon", label: "clears demo copies" },
];

export type JourneyStep = { title: string; sub: string; nodes: string[]; edges: string[]; call?: string; thumb?: string };
export type Journey = { id: string; title: string; blurb: string; steps: JourneyStep[] };

export const JOURNEYS: Journey[] = [
  {
    id: "dispute",
    title: "A dispute arrives",
    blurb: "From PayPal to Under review",
    steps: [
      { title: "The client opens a dispute", sub: "In PayPal’s Resolution Center", nodes: ["client", "disputes"], edges: ["client-disputes"], call: "reason: MERCHANDISE_OR_SERVICE_NOT_RECEIVED · $250" },
      { title: "Sync picks it up", sub: "Polls PayPal every 30 minutes", nodes: ["sync", "disputes"], edges: ["sync-disputes"], call: "GET /v1/customer/disputes/{id}" },
      { title: "The agent writes a plan", sub: "Its first move, specific to the case", nodes: ["sync", "draftPacket", "openai"], edges: ["sync-agent", "agent-openai"], call: "write_plan([“Read the buyer’s claim that the files never arrived”, …])" },
      { title: "It opens the evidence", sub: "Read-only tools over the proof locker", nodes: ["draftPacket", "neon", "openai"], edges: ["agent-neon", "agent-openai"], call: "read_locker_item(“C”) → harmattan-cover-final.png", thumb: "/demo/harmattan-cover-final.png" },
      { title: "Claims are checked in code", sub: "Unsupported claims are struck", nodes: ["draftPacket", "claims", "injection"], edges: ["agent-claims", "agent-injection"], call: "check_claims → 4 kept, 0 struck · 1 instruction ignored" },
      { title: "The seller approves", sub: "Nothing is sent without it", nodes: ["seller", "app", "submitEvidence"], edges: ["seller-app", "app-submit"], call: "Approve and send to PayPal" },
      { title: "Cleared calls provide-evidence", sub: "A PDF summary plus notes", nodes: ["submitEvidence", "r2", "disputes"], edges: ["submit-r2", "submit-disputes"], call: "POST /v1/customer/disputes/{id}/provide-evidence" },
      { title: "PayPal: Under review", sub: "The case is with PayPal", nodes: ["disputes"], edges: [], call: "status: UNDER_REVIEW" },
    ],
  },
  {
    id: "sale",
    title: "Check a sale before invoicing",
    blurb: "From a draft to a paid invoice",
    steps: [
      { title: "The seller describes the sale", sub: "Client, price, what’s delivered", nodes: ["seller", "app"], edges: ["seller-app"], call: "Character sheet: 3 poses · $400" },
      { title: "Rule checks run", sub: "Against their history and PayPal’s rules", nodes: ["app"], edges: [], call: "check_amount → This sale is 3× your average" },
      { title: "The AI reads it like a reviewer", sub: "Finds what the rules can’t", nodes: ["app", "openai"], edges: ["app-openai"], call: "review_as_paypal → Usage rights aren’t stated" },
      { title: "Cleared sends the invoice", sub: "With the fixes the seller accepted", nodes: ["app", "invoicing"], edges: ["app-invoicing"], call: "POST /v2/invoicing/invoices/{id}/send" },
      { title: "PayPal says it’s paid", sub: "A signed, verified event", nodes: ["events", "webhook", "neon"], edges: ["events-webhook", "webhook-neon"], call: "INVOICING.INVOICE.PAID · signature verified" },
    ],
  },
  {
    id: "delivery",
    title: "Client confirms delivery",
    blurb: "Proof kept as the work ships",
    steps: [
      { title: "The seller adds the files", sub: "Kept in the proof locker", nodes: ["seller", "app", "r2"], edges: ["seller-app", "app-r2"], call: "harmattan-cover-final.png · 634 KB", thumb: "/demo/harmattan-cover-final.png" },
      { title: "The client opens their link", sub: "A private confirmation page", nodes: ["client", "accept"], edges: ["client-accept"], call: "/accept/{token}" },
      { title: "Their confirmation is recorded", sub: "Name, time, device, IP address", nodes: ["accept", "neon"], edges: ["accept-neon"], call: "acceptance → exhibit E" },
      { title: "Goods: tracking goes to PayPal", sub: "So the hold releases after delivery", nodes: ["app", "orders"], edges: ["app-orders"], call: "orders.createOrderTracking({ carrier: “UPS”, … })" },
    ],
  },
  {
    id: "decide",
    title: "PayPal decides",
    blurb: "From Under review to resolved",
    steps: [
      { title: "PayPal reviews the evidence", sub: "In the sandbox, Cleared can ask it to decide", nodes: ["app", "disputes"], edges: ["app-disputes"], call: "POST /v1/customer/disputes/{id}/adjudicate" },
      { title: "PayPal sends the result", sub: "A signed event, and the next sync", nodes: ["events", "webhook", "sync", "disputes"], edges: ["events-webhook", "sync-disputes"], call: "CUSTOMER.DISPUTE.RESOLVED" },
      { title: "The case closes", sub: "Shown on Home and in Activity", nodes: ["webhook", "neon", "app"], edges: ["webhook-neon"], call: "Closed in your favour" },
    ],
  },
];

/** What the AI cannot do, and the piece of the system that stops it. */
export const CANNOT: { title: string; how: string; node: string }[] = [
  { title: "Send money or refund", how: "Its tools only read. Payments, refunds and payouts aren’t reachable from the agent.", node: "draftPacket" },
  { title: "Submit without the seller", how: "provide-evidence runs only in submitEvidence, which needs an approval signed by the seller’s session.", node: "submitEvidence" },
  { title: "Cite a file that isn’t there", how: "The claim checker strikes any claim whose exhibit, date, amount or file name doesn’t match.", node: "claims" },
  { title: "Follow a buyer’s hidden instructions", how: "Buyer text is data. Refused instructions are flagged, and code confirms the quote is real.", node: "injection" },
  { title: "Act on a forged PayPal event", how: "Each webhook is verified against PayPal’s signature before it is stored.", node: "webhook" },
];

export type Decision = { area: string; chose: string; why: string; rejected?: string };

export const DECISIONS: Decision[] = [
  { area: "Agent shape", chose: "A structured workflow with one agentic step", why: "Every step around a dispute is known in advance and mistakes cost money, so code orchestrates them. The model is used where judgement is needed: investigating the case, with read-only tools.", rejected: "A free-roaming agent with write access" },
  { area: "Trust", chose: "Code checks the model", why: "The claim checker, the injection check and the approval gate are plain code with unit tests, so a model mistake is caught before it reaches PayPal.", rejected: "Asking a second model to review the first" },
  { area: "Model", chose: "gpt-5.4-mini, gpt-5.4 for disputes of $500+", why: "The evals showed the same recommendations on both; the larger model writes more supported claims, so it’s used where more money is at stake.", rejected: "One large model for everything (about 4× the cost per case)" },
  { area: "Background jobs", chose: "Render Workflows", why: "The investigation and the submission need retries and must survive a restart; the web request only starts them and streams their steps.", rejected: "A queue library on the web service" },
  { area: "Disputes arriving", chose: "Webhooks plus a 30-minute sync", why: "Webhooks are fast; the sync means a missed or delayed webhook can’t lose a dispute.", rejected: "Webhooks alone" },
  { area: "Webhook security", chose: "Verify the signature on the raw bytes", why: "PayPal signs the exact body it sent. Checking a re-serialised copy can fail, so the certificate check runs on the original bytes, with PayPal’s verify API as a fallback.", rejected: "Trusting the event or re-serialising it" },
  { area: "PayPal Orders & tracking", chose: "The SDK from APIMatic’s PayPal Context Plugin", why: "Typed requests and errors; its guidance found a real bug (re-sending a write after a timeout), now fixed with a claim and a re-read.", rejected: "Hand-written requests for Orders" },
  { area: "Invoicing, Disputes, Webhooks", chose: "A small typed REST client", why: "These APIs aren’t in the Orders SDK, and the Agent Toolkit has no provide-evidence.", rejected: "PayPal Agent Toolkit on the runtime path" },
  { area: "Files", chose: "Cloudflare R2", why: "Proof files must persist and be readable by workflow tasks by key; workflow arguments are capped at 4 MB.", rejected: "A disk on the web service" },
  { area: "Hosting", chose: "An always-on Render web service", why: "A sleeping instance would miss webhooks and give a judge a one-minute cold start.", rejected: "A free tier that sleeps" },
  { area: "Access", chose: "One-click demo workspaces", why: "Anyone can try it without an account or keys; each visitor gets a private copy that resets nightly.", rejected: "Sign-up with email links" },
  { area: "Language", chose: "TypeScript end to end", why: "The web app and the workflow tasks share types, the PayPal client and the agent code.", rejected: "A Python backend with a separate frontend" },
];
