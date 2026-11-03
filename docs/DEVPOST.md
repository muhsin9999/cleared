# Devpost submission: Cleared

Paste-ready text for each Devpost field. Every figure here is sourced in [PRODUCT.md](PRODUCT.md), [COPY.md](COPY.md),
[AI.md](AI.md) or the [README](../README.md). Fill the two `TODO` links at submission.

---

## Tagline (under 200 characters)

An AI agent that answers PayPal disputes for freelancers, with proof collected at the time of sale, and checks every sale before PayPal does.

## Inspiration

A new illustrator sends her first big PayPal invoice. The client pays, then says "I never got the files". PayPal Seller Protection covers shipped goods, not digital work or services, so her only defence is proof, and she has about 10 days to send it.

This is common. The CFPB lists 3,010 complaints against PayPal under "Trouble accessing funds in your mobile or digital wallet" between 1 January 2025 and 30 September 2026. About a third of the top r/paypal posts of the past year are about limitations or holds, many from artists whose account was limited after a first commission. A lawyer's demand letter for frozen funds costs about $575. Most tools act only after a buyer files. We wanted to protect the seller across the whole sale.

## What it does

Cleared follows a freelancer's sale from start to finish:

1. **Before the invoice:** Cleared AI checks the sale against the seller's own history and PayPal's published rules (a price far above their usual, no delivery date, a vague description, no refund terms). Each finding comes with a one-click fix. Then Cleared sends a real PayPal invoice.
2. **During delivery:** it keeps the proof in a locker: the files, the agreed scope, tracking for shipped goods, and the client's own confirmation of receipt through a link that needs no login.
3. **When a dispute arrives:** the agent investigates on its own. It writes a plan, opens the dispute, the sale, the invoice and every file, and checks PayPal's rules. Then it drafts a reply in which every claim cites an exhibit. Code checks each claim against its exhibit and strikes any that don't match. The seller approves, and Cleared submits the evidence through PayPal's Disputes API.
4. **"PayPal" emails:** paste one in and Cleared tells a phishing email from a real notice. For a real one, it matches what PayPal asks for against the files already in the locker.
5. **Ask Cleared, any time:** a chat in the top bar that answers from your sales, holds and cases, and files a screenshot or PDF to a sale's proof locker so the agent can cite it.

Every model call is in the AI audit log with its model, tokens and cost, and every PayPal webhook is signature-checked before it is stored.

## How we built it

- **PayPal (sandbox):**
  - Invoicing v2: create, send and track payment.
  - Disputes v1: list, get, `provide-evidence` (multipart PDF) and the sandbox `adjudicate` call.
  - Orders v2 and Payments v2, with Add Tracking, through the PayPal TypeScript SDK from APIMatic's PayPal Context Plugin.
  - Webhooks, verified with PayPal's certificate check on the raw bytes.
  - A cron job polls Disputes every 30 minutes in case a webhook is missed.
- **AI:** the OpenAI Responses API with `gpt-5.4-mini` (disputes of $500 or more go to `gpt-5.4`).
  - Strict structured outputs and read-only tools: the agent has no tool that can send, refund or change anything.
  - A deterministic claim checker and a prompt-injection guard: buyer messages are data, and the agent reports any instruction it refused.
- **Infrastructure:**
  - Render: the web service, a Workflow that runs the agent with retries and survives restarts, and two cron jobs.
  - Neon Postgres with Drizzle, and Cloudflare R2 for files.
- **App:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui and Motion.
- **APIMatic:** we installed the plugin in Claude Code on 22 Oct, partway through the build. We rebuilt the tracking code with its skills and wrote its contract sheet (`paypal-plan.md`). That review caught a real bug: our code re-sent "add tracking" after a timeout. Now it re-reads the order, so a buyer never gets the same tracking number twice.

## Challenges we ran into

- **Disputes need a real buyer.** In the sandbox, only the buyer can open a dispute, in PayPal's own site. So judge mode keeps a small stock of real sandbox disputes, opened by hand, and uses a clearly labelled "Test dispute" if the stock runs out.
- **Webhook signatures** only verify on the exact raw bytes PayPal sent, not on re-serialised JSON.
- **Sandbox invoices** can only be paid by a sandbox account, so demo invoices are addressed to the sandbox buyer.
- **A write that timed out may have succeeded.** Every PayPal write is claimed in the database first, and an unanswered write is settled by re-reading PayPal, never by guessing "failed".
- **PayPal has no API for account limitations,** so for those Cleared drafts the reply and the documents, and the seller sends them themselves. We say so in the app.

## Accomplishments that we're proud of

- **The agent's eval suite:** 13 scenarios, each run 3 times against the real model, covering strong and weak cases, goods and services, three prompt injections and failing tools.
  - With `gpt-5.4-mini`: the right recommendation 39/39 times, prompt injections resisted 9/9, about 7.5 s and $0.006 per case.
  - After we added the plan step: 13/13 scenarios and 89/89 checks passed.
- **Code checks every claim** in the reply, so the seller never sends a date or file name that isn't in their evidence.
- **The whole loop runs on real sandbox APIs,** from invoice to submitted evidence to PayPal's decision, and a judge can try it with one click and no sign-up.

## What we learned

The AI is the easy part. Trust comes from what surrounds it: read-only tools, code that checks the model's claims, a human approval before anything is sent, and an audit log that shows every call and its cost.

## What's next for Cleared

- **Multi-merchant onboarding** through PayPal Partner Referrals, so any seller can connect their own account.
- **Live (non-sandbox) mode**, with the same approval step.
- **An official route for holds and limitations,** if PayPal opens one, to replace today's manual hand-off.

## Built with

`nextjs` `react` `typescript` `tailwindcss` `shadcn-ui` `openai` `paypal` `paypal-invoicing` `paypal-disputes` `apimatic` `render` `neon` `postgresql` `drizzle` `cloudflare-r2` `vitest` `playwright`

## Try it out

- Live app: https://cleared-web.onrender.com
- Code: https://github.com/muhsin9999/cleared
- How it's built (interactive map): https://cleared-web.onrender.com/architecture
- Video: TODO (YouTube link)

## Testing instructions (Devpost "Testing instructions" field)

No sign-up, keys or PayPal login needed.

1. Open https://cleared-web.onrender.com and click **Try the live demo**. You are Ada, an illustrator with a connected sandbox PayPal account. Each visitor gets their own private copy of her workspace.
2. Wait a few seconds on Home. A $250 dispute arrives ("I never received the files"). Click **Open the case**.
3. Watch the agent: its plan, each tool call and each file it opens (click any file to see it). It takes about 15 seconds.
4. Read the reply. Every claim has exhibit letters, and anything the agent refused to do, such as an instruction hidden in the buyer's message, is shown.
5. Click **Approve and send**: Cleared submits the evidence to PayPal. Then click **Ask PayPal to decide** (a sandbox-only shortcut).
6. Optional: **New sale** → **Try a sample** → **Check this sale** to see the pre-sale check and its fixes, then create and send a real sandbox invoice.
7. Optional: **Settings → AI audit log** shows every model call with its tokens and cost.

**Sandbox** in the top bar plays the other side: the client paying, opening a dispute, PayPal deciding, or resetting the workspace. If the stock of real sandbox disputes has run out, the case is a clearly labelled **Test dispute**, and everything else works the same.
