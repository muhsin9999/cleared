# Cleared

**An AI agent that answers PayPal disputes for freelancers, with proof they collected at the time of sale.**

PayPal Seller Protection covers shipped goods. It doesn't cover digital work or services, so when an illustrator's client says "I never got the files", the seller's only defence is proof. Most freelancers don't have it organised, the reply window is about 10 days, and a lost dispute costs the payment plus a mark on the account.

Cleared fixes both ends:

1. **Before the sale**, Cleared AI checks it against the seller's history and PayPal's published rules, suggests fixes (a deposit, a delivery date, written terms), and sends a proper PayPal invoice.
2. **While the work is delivered**, it keeps the proof: the files, the agreed scope, and the client's own confirmation of receipt.
3. **When a dispute arrives from PayPal**, the agent investigates on its own: it plans, opens the evidence, checks PayPal's rules and drafts a reply where every claim cites an exhibit. Code checks each claim, the seller approves, and Cleared submits the evidence through PayPal's Disputes API.

**Live demo:** <https://cleared-web.onrender.com> → **Try the live demo** (no sign-up, no keys). Video: _link added at submission_.

> Cleared is not affiliated with or endorsed by PayPal. It runs on the public PayPal sandbox; no real money moves.

## Try it in 60 seconds

1. Open the live demo and click **Try the live demo**. You're Ada, an illustrator whose sandbox PayPal account is connected.
2. Wait a few seconds on Home: a $250 dispute arrives ("I never received the files"). Click **Open the case**.
3. Watch the agent work: its plan, each tool call, each file it opens. Click any file to see it in full.
4. Read the reply. Every claim has exhibit letters; struck claims and anything the agent refused to do are shown.
5. **Approve and send**. Cleared submits the evidence to PayPal. Then **Ask PayPal to decide** (a sandbox-only shortcut).
6. Optional: **New sale** → *Try a sample* → **Check this sale**, to see the pre-sale check, the fixes and a real PayPal invoice.

Each visitor gets a private copy of the workspace. **Sandbox** in the top bar holds the other side's actions (the client paying, opening a dispute, resetting).

## What's real

| Part | Real or simulated |
| --- | --- |
| PayPal invoices | Real sandbox invoices: Invoicing v2 create, send and track payment |
| Disputes | Real sandbox disputes opened by a sandbox buyer, read from the Disputes API. If the stock of pre-opened disputes runs out, a labelled **Test dispute** is used instead |
| Evidence | Submitted with the real `provide-evidence` call (a PDF summary plus notes); PayPal moves the case to *Under review* |
| Webhooks | Every delivery is verified against PayPal's signature before it is stored |
| AI | Real model calls on every case and every sale check. Each one is in **Settings → AI audit log** with its model, tokens and cost |
| Decision | "Ask PayPal to decide" calls the sandbox-only `adjudicate` endpoint |

## How the AI works

**The agent** (`src/server/ai/investigate.ts`) is a tool-using loop on the OpenAI Responses API (`gpt-5.4-mini`; disputes of $500 or more go to `gpt-5.4`). It runs as a Render Workflow task, so it retries and survives restarts, and it streams each step to the case screen.

- **Plans first.** Its first call is `write_plan`: three to five steps written for this case.
- **Read-only tools.** `get_dispute`, `get_sale`, `get_invoice`, `list_locker_items`, `read_locker_item`, `get_tracking` and `search_policy`. It has no tool that can send, refund or change anything.
- **Claim checker** (`src/lib/claim-checker.ts`). Code, not the model, checks that each claim cites a real exhibit and that its dates, amounts and file names match that exhibit. Claims that fail are struck and shown to the seller.
- **Prompt-injection guard.** Buyer messages and uploaded text are treated as data. The agent reports instructions it refused; `src/lib/injection.ts` keeps a flag only if the quote really appears in the case.
- **Honest recommendations.** It can recommend *fight*, *offer a partial refund* or *accept*, and must say what proof is missing.
- **Human approval.** Only an approval signed by the seller's session can start the `submitEvidence` task.

**Evals** (`npm run eval`, [evals/README.md](evals/README.md)): 13 scenarios × 3 runs against the real model, covering strong and weak cases, goods and services, three prompt injections and failing tools.

| | `gpt-5.4-mini` | `gpt-5.4` |
| --- | --- | --- |
| Runs passing every check | 38/39 | 38/39 |
| Recommendation right | 39/39 | 39/39 |
| Prompt injections resisted | 9/9 | 9/9 |
| Average time per case | 7.5 s | 14.5 s |
| Average cost per case | $0.006 | $0.023 |

After the plan step was added (22 Oct, one run on `gpt-5.4-mini`): 13/13 scenarios passed, 89/89 checks, no claims struck, $0.007 per case.

The two other AI jobs run while the seller waits: **the sale check** (`src/server/ai/preflight.ts`, about $0.002) and **the notice reader** (`src/server/ai/notice.ts`), which spots fake "PayPal" emails before drafting a reply. Both fall back to rule-based results if the model is unavailable.

## PayPal APIs used

| API | Calls | Where |
| --- | --- | --- |
| Invoicing v2 | generate-next-invoice-number, create, send, get | `src/server/paypal/invoicing.ts` |
| Disputes v1 | list, get, `provide-evidence` (multipart), `adjudicate` (sandbox) | `src/server/paypal/disputes.ts`, `evidence.ts` |
| Webhooks | PayPal's certificate check on the raw body, with `verify-webhook-signature` as the fallback | `src/server/paypal/webhooks.ts`, `src/lib/paypal-signature.ts` |
| Orders v2 and Payments v2, through the official Server SDK | `getCapturedPayment`, `createOrderTracking` | `src/server/paypal/tracking.ts` |
| Events received | `INVOICING.INVOICE.PAID/CANCELLED`, `CUSTOMER.DISPUTE.CREATED/UPDATED/RESOLVED`, `PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.APPROVED` | `src/app/api/paypal/webhook/route.ts` |

A cron job also polls the Disputes API every 30 minutes, so a dispute still arrives if a webhook is missed.

## Architecture

_Diagram to come._

| Piece | What it runs |
| --- | --- |
| `cleared-web` (Render web service) | Next.js 16 app: the UI, server actions, the PayPal webhook and the client's confirmation page |
| `cleared-wf` (Render Workflow) | `draftPacket` (the agent) and `submitEvidence` (only after approval), with retries |
| `cleared-dispute-sync` (Render cron, every 30 min) | Pulls new or changed disputes from PayPal and starts the agent |
| `cleared-nightly-reset` (Render cron) | Clears old demo workspaces |
| Neon Postgres | Sellers, sales, proof, disputes, packets, events, the audit log |
| Cloudflare R2 | Proof files (demo files ship in `public/demo`) |

## Run it locally

Needs Node 22, a PayPal sandbox app, an OpenAI key and a Postgres database (Neon's free tier works).

```bash
git clone <this repo> && cd cleared
npm install
cp .env.example .env.local      # fill in PayPal, OpenAI, DATABASE_URL, SESSION_SECRET
npm run db:migrate && npm run db:seed
npm run dev                     # http://localhost:3000 → Try the live demo
```

- Set `DEMO_TEST_DISPUTES=true` locally so you don't use up the real sandbox dispute stock.
- Locally the agent runs in-process. On Render, `USE_RENDER_WORKFLOWS=true` sends it to the `cleared-wf` Workflow.
- Register a PayPal webhook to `<your URL>/api/paypal/webhook` and put its ID in `PAYPAL_WEBHOOK_ID`.

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests (Vitest): claim checker, injection guard, pre-flight rules, webhook signatures, PayPal events |
| `npm run e2e` | Browser tests (Playwright): the full sale → invoice → dispute → approval path, plus failure cases |
| `npm run eval` | The agent evals against the real model (costs about $0.07 per full run) |
| `npm run disputes:sync` | Pull disputes from PayPal once |

## Built with

Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui on Base UI, Motion · OpenAI Responses API · PayPal REST APIs and `@paypal/paypal-server-sdk` · Render (web service, Workflows, cron) · Neon Postgres with Drizzle · Cloudflare R2 · Vitest and Playwright.

Design and planning notes are in [docs/](docs/): product, flows, PayPal integration, AI design, stack, demo script.

## Licence

[MIT](LICENSE)
