# Stack and architecture

Each choice is judged against four tests:
1. **Does it make the demo more reliable?**
2. Does it help a sponsor prize *honestly*?
3. Can one person ship it by 1 Nov?
4. Is it free or cheap to keep running for judges until 15 Dec?

## Decisions

| Layer | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Language | **TypeScript end to end** | Render Workflows supports TypeScript and Python. One language shares types and the PayPal client between the web app and the workflow tasks. | Python backend + JS frontend: two toolchains, duplicated types |
| App framework | **Next.js (latest stable, App Router), React 19** | One deployable unit holds the UI, server actions and the `/api/paypal/webhook` route. shadcn/ui and the animation registries are Next-first. | Vite SPA + Hono API: an extra service with no benefit. Remix: smaller component ecosystem. |
| Hosting | **Render web service, Starter ($7/mo, always on)** | The Render prize requires Render hosting. Free instances sleep after 15 min, which would lose webhooks and give judges a one-minute cold start. | Render free tier; Vercel (would forfeit the Render prize story) |
| Background jobs | **Render Workflows** (`@renderinc/sdk` ≥1.3, public beta) | The prize requires it, and Cleared genuinely needs durable, retried, multi-step jobs: the dispute investigation, evidence submission and auto-tracking. Task chaining fits the packet pipeline. | A queue library on the web service. It works, but loses the sponsor prize and the retries Render provides. |
| Schedules | **Render cron job** → starts a workflow task | Workflows has no native schedule. The nightly hold-release and deadline watcher runs from cron. | — |
| Database | **Render Postgres basic-256mb ($6/mo)** | The free Postgres **expires after 30 days**, which would break judging on 15 Dec. Paid stays on the private network and keeps the whole story on Render. | Render free Postgres; Neon free (fallback only) |
| ORM | **Drizzle + drizzle-kit** | SQL-first, light, quick cold starts, and migrations run as a Render pre-deploy command | Prisma (heavier engine, slower cold start) |
| File storage | **Cloudflare R2** (S3 API, 10 GB free, free egress) | Proof files must persist and be fetchable by workflows by key. Workflow arguments are capped at 4 MB, so pass keys, not files. Render disks block zero-downtime deploys. | Render disk; Supabase storage |
| PayPal (Orders, capture, tracking) | **`@paypal/paypal-server-sdk`**, written with the **APIMatic Context Plugin** | The SDK covers Orders, including `createOrderTracking`. The plugin is the APIMatic prize requirement. | — |
| PayPal (Invoicing, Disputes, Webhooks) | **Typed REST client** (fetch + Zod) | The Server SDK has no Invoicing or Disputes. The Agent Toolkit has no `provide-evidence`, and its tracking tool calls a deprecated endpoint. | Agent Toolkit on the runtime path: it depends on `ai@^4`, and the sandbox MCP `create_invoice` has been failing since 6 Oct |
| PayPal Agent Toolkit / MCP | **Nice-to-have N1 only** (read-only "Ask Cleared") | Shows DevRel judges we know the toolkit, without risking the core demo | — |
| AI | **`openai` SDK, `gpt-5-mini`** (model set by `AI_MODEL`) | Cheap enough to run every eval and every judge click. Strict structured outputs, image/PDF input, function tools, automatic prompt caching. A stronger GPT model can replace it per job. See [AI.md](AI.md). | Claude Opus (stronger, but about 15× the cost); OpenRouter models (cheaper, but structured-output and tool support varies by provider; kept as a `baseURL` swap); Vercel AI SDK (adds little; version clash with the toolkit) |
| Validation | **Zod** | One schema for each PayPal payload, AI output and form | — |
| UI | **shadcn/ui (Base UI) + Tailwind v4 + Motion + Magic UI + Cult UI + NumberFlow + Sonner** | See [DESIGN.md](DESIGN.md) | Aceternity (licence), Origin/coss (AGPL), HeroUI (would mix two paradigms) |
| Auth | **Seeded demo accounts + signed session cookie** ("Enter as Ada") | Judges need instant, keyless access. Magic links need an inbox. | Auth.js providers, Clerk |
| Testing | **Vitest** (units: risk rules, claim checker, webhook verify) + **Playwright** (one golden path) | The golden-path test proves the demo before filming | — |
| API collection | **Postman** public collection + environment | Judges can replay the PayPal flows. Pooja Mistry (Postman) is a judge. | — |

## Architecture

```
 Judge / Seller (browser) ──HTTPS──▶ Render Web Service  "cleared-web"  (Next.js, Starter)
                                      • UI + server actions
                                      • /api/paypal/webhook  (raw body → verify signature → store event)
                                      • /accept/[token]  (public client acceptance page)
                                      • approval inbox (human-in-the-loop)
                                         │            │ @renderinc/sdk  runTask("cleared-wf/<task>", [ids])
                              Drizzle    │            ▼
                                         ▼     Render Workflow  "cleared-wf"
                               Render Postgres   preflightCheck · createInvoice · autoTrack(captureId)
                               (sellers, sales,  onDisputeCreated → gatherProof → draftPacket(GPT)  
                                proofs, events,     → checkClaims → status=AWAITING_APPROVAL
                                packets, audit)  submitEvidence (only after approval) · sandboxAdjudicate
                                         ▲            │                     │
                                         └────────────┘                     ├──▶ PayPal sandbox REST
                               Render Cron "cleared-cron" (nightly) ──▶ holdWatcher task
                                                                            ├──▶ OpenAI API (gpt-5-mini)
 PayPal sandbox ──webhooks──▶ cleared-web                                   └──▶ Cloudflare R2 (proof files)
```

**Rules:**
- The web service never calls the AI model in a request handler for long jobs; it starts a workflow task and streams status from Postgres.
- Only the `submitEvidence` task can move a dispute forward, and it runs only when an approval record exists, signed by the seller session.

## Repository layout

```
cleared/
  app/                 Next.js routes (ui, api/paypal/webhook, accept/[token])
  components/          ui (shadcn), motion wrappers, feature components
  lib/paypal/          oauth, invoicing, orders+tracking (server sdk), disputes, webhooks-verify
  lib/ai/              prompts, schemas (zod), claim-checker, knowledge base loader
  lib/db/              drizzle schema + queries
  workflows/           Render Workflow tasks (separate service entry)
  knowledge/           PayPal policy excerpts (markdown, cited URLs)
  scripts/             seed-demo, reset-demo, sandbox helpers
  tests/               vitest + playwright
  docs/                these planning docs
  render.yaml          Blueprint: web + workflow + cron + postgres
  postman/             collection + environment
```

## Environments and secrets

`.env.example` (committed; real values never committed):

```
PAYPAL_CLIENT_ID=  PAYPAL_CLIENT_SECRET=  PAYPAL_WEBHOOK_ID=  PAYPAL_ENV=sandbox
PAYPAL_SANDBOX_BUYER_EMAIL=            # used only by judge-mode dispute simulation
OPENAI_API_KEY=  AI_MODEL=gpt-5-mini  AI_FALLBACK_MODEL=
DATABASE_URL=
R2_ACCOUNT_ID= R2_ACCESS_KEY_ID= R2_SECRET_ACCESS_KEY= R2_BUCKET=
RENDER_API_KEY=  WORKFLOW_SLUG=cleared-wf
SESSION_SECRET=
DEMO_MODE=true
```

## Cost (1 Nov to 15 Dec)

| Item | Monthly |
| --- | --- |
| Render web Starter | $7 |
| Postgres basic-256mb | $6 |
| Workflows (flex, well under 10 CPU-hours) | about $1–3 |
| Cron | under $1 |
| R2 | $0 |
| **Render total** | **about $15** (covered by the $50 hackathon credit; **confirm the credit lasts into December**) |
| OpenAI API | about $2–10 (spend limit set; demo results cached) |

## Deployment

1. Deploy the empty skeleton **on day 2**. A deployed "hello" beats a perfect local app.
2. Use a `render.yaml` Blueprint with four services: web, workflow, cron and postgres. The pre-deploy command runs `drizzle-kit migrate`.
3. Register the PayPal webhook to `https://<cleared-web>.onrender.com/api/paypal/webhook` (HTTPS, port 443). Use a tunnel such as `cloudflared` for local development.
4. Run `scripts/reset-demo` nightly from cron so judges always see a clean, seeded state.
