# PayPal integration

All calls go to `https://api-m.sandbox.paypal.com`. Sources were checked on 19 Oct 2026; recheck them during the day-1 spike.

## 1. Sandbox setup (day 1)

1. In the Developer Dashboard, create a **US sandbox Business account** (Maya) and a **US sandbox Personal account** (the client/buyer). A forum report shows a non-US sandbox merchant getting 422s on capture ([forum](https://paypalaihackathon.devpost.com/forum_topics/45513-sandbox-we-aren-t-able-to-process-your-payment-using-your-paypal-account-at-this-time)).
2. Create a REST app linked to the US Business account. Enable these features: **Invoicing, Disputes (Customer disputes add-on), Transaction Search, Payouts (off)**. After changing features, request a new token so the new scopes take effect.
3. Register the webhook URL and subscribe to the events in §6. Store `PAYPAL_WEBHOOK_ID`.

## 2. OAuth

- `POST /v1/oauth2/token` with Basic `client_id:secret` and `grant_type=client_credentials`.
- Cache the token, which lasts hours in the sandbox, and refresh on a 401.

## 3. Invoicing v2 (F2): REST client

- **Endpoints:**
  - `POST /v2/invoicing/generate-next-invoice-number`
  - `POST /v2/invoicing/invoices`: create a draft. It needs `items[]`. Use `detail.note`, `detail.terms_and_conditions` and `detail.payment_term`.
  - `POST /v2/invoicing/invoices/{id}/send`
  - `GET /v2/invoicing/invoices/{id}`
  - `POST /v2/invoicing/invoices/{id}/remind`
  - `POST /v2/invoicing/invoices/{id}/generate-qr-code`: returns a base64 PNG, used by N4.
  - `POST /v2/invoicing/invoices/{id}/payments`: records an off-PayPal payment; used only in tests.
- **Webhooks:** `INVOICING.INVOICE.PAID`, `.UPDATED`, `.CANCELLED`, `.REFUNDED`.
- **Reference:** [Invoicing v2](https://developer.paypal.com/docs/api/invoicing/v2/).
- **Demo:** the sandbox buyer pays the invoice from the PayPal-hosted invoice link. The paid webhook reaches the timeline.

## 4. Orders v2 + Add Tracking (F3, F4): `@paypal/paypal-server-sdk`

- **Shop sales (goods path):** `POST /v2/checkout/orders` → buyer approves → `POST /v2/checkout/orders/{id}/capture`.
- **Tracking:** `POST /v2/checkout/orders/{id}/track` with `{capture_id, tracking_number, carrier, notify_payer, items}`. Cancel with `PATCH …/trackers/{tracker_id}`.
  - **Do not** use `/v1/shipping/trackers-batch`; it is deprecated. The Agent Toolkit's tracking tool still uses it.
- **Built with the APIMatic Context Plugin** (`npx context-plugins install paypal`).
- **Webhooks:** `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `.PENDING`, `.REFUNDED`, `.REVERSED`.
- **Caveat:** `seller_protection.status=ELIGIBLE` is a snapshot of declared data, not a guarantee. Don't present it as one.

## 5. Disputes v1 (F6, F8): REST client

| Action | Endpoint | Notes |
| --- | --- | --- |
| List / get | `GET /v1/customer/disputes`, `GET /v1/customer/disputes/{id}` | Always drive actions from the response's HATEOAS `links` |
| **Provide evidence** | `POST /v1/customer/disputes/{id}/provide-evidence` (multipart) | Parts: `input` (JSON `{evidences:[{evidence_type, notes, evidence_info:{tracking_info:[…]}}]}`) plus `evidence-file` parts. Files must be JPG/GIF/PNG/PDF, ≤10 MB each, ≤50 MB per case. Only allowed when status is `WAITING_FOR_SELLER_RESPONSE` **and** the link exists. |
| Accept claim | `POST …/{id}/accept-claim` | Refunds the buyer. Offered as an option when evidence is weak. |
| Make offer | `POST …/{id}/make-offer` | `INQUIRY` stage only |
| Send message | `POST …/{id}/send-message` | Inquiry-stage message to the buyer |

**Evidence types used:**
- `PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED` (Maya's case)
- `PROOF_OF_FULFILLMENT`
- `ONLINE_TRACKING_INFORMATION`
- `COPY_OF_CONTRACT` (the invoice + terms)
- `PROOF_OF_REFUND`

**Sandbox simulation for judge mode** ([test guide](https://developer.paypal.com/disputes/test-go-live)):
- **Create via API (blocked for now):** `POST /v1/customer/disputes` (sandbox only), multipart `input={disputed_transactions:[{buyer_transaction_id}], reason, dispute_amount}`.
  - It needs a `PayPal-Auth-Assertion` header: an unsigned JWT, header `{"alg":"none"}`, payload `{"iss": client_id, "email": buyer_email}`.
  - Use amounts ≥ $11 so the dispute doesn't escalate early.
- **Move to seller response:** `POST …/{id}/require-evidence`, which takes the status to `WAITING_FOR_SELLER_RESPONSE`.
- **Resolve:** `POST …/{id}/adjudicate` with `{"adjudication_outcome":"SELLER_FAVOR"}`. This produces `CUSTOMER.DISPUTE.RESOLVED`.
- **Backup path:** the sandbox buyer opens a case in the sandbox Resolution Center UI. It takes a few minutes to appear.

**Webhooks:** `CUSTOMER.DISPUTE.CREATED`, `.UPDATED`, `.RESOLVED`.

## 6. Webhooks (F5)

- **Subscribe:** all events above. `POST /v1/notifications/webhooks`, or set them up in the Dashboard.
- **Verify every event:** `POST /v1/notifications/verify-webhook-signature`, or locally with RSA-SHA256 over `transmissionId|timeStamp|webhookId|crc32(rawBody)`. **Read the raw body before parsing.**
- **Simulator events cannot be verified** ([simulator](https://developer.paypal.com/api/rest/webhooks/simulator/)). Accept them only when `DEMO_MODE=true`, and tag them "simulated" in the timeline.
- **Idempotency:** store `event.id` as a unique key. PayPal retries up to 25 times over 3 days.
- **Processing:** store the event, start the workflow task, and return 200 quickly.

## 7. Transaction Search (F1 history): cached only

- `GET /v1/reporting/transactions` (feature must be enabled; max 31-day window per request).
- Data **lags up to 3 hours**, so never rely on it in the live demo. Seed Maya's history on day 1 and cache it nightly.

## 7b. Day-1 spike results (20 Oct 2026)

Scripts live in `scripts/spikes/` and run with `node --env-file=.env.local scripts/spikes/<file>.mjs`.

| Call | Result |
| --- | --- |
| OAuth client credentials | **Pass.** 32 scopes, including invoicing, disputes (read-seller, update-seller) and webhooks |
| Invoicing create → send | **Pass** (`INV2-HB7L-9RVB-TAER-U88E`) |
| Buyer pays the invoice | **Pass**, invoice `PAID`; payment id `35156309J57118646` |
| `INVOICING.INVOICE.PAID` webhook + `verify-webhook-signature` | **Pass**, `SUCCESS` on a real event (redelivered with `POST /v1/notifications/webhooks-events/{id}/resend` after the tunnel dropped) |
| Render Workflows: `startTask` → chained tasks → PayPal OAuth inside a task | **Pass** locally (`render workflows dev`, SDK 1.3.0) and **hosted on Render** (20 Oct, `cleared-wf`, run `trn-0994gdbbp5ru70650008gv2a0`, PayPal OAuth from the env group). The SDK method is `render.workflows.startTask`, not `runTask` |
| Orders create → buyer approves → capture → `/track` | **Pass** (capture `00X721973U2377446`, `seller_protection=ELIGIBLE`, tracker `SHIPPED`). The new checkout page (`payment_source.paypal.experience_context`) failed twice with "Things don't appear to be working"; the classic `application_context` approve link worked. **Use the classic form for the demo.** |
| `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED` webhooks | **Pass**, both verified |
| Card payments | Not enabled: `PAYEE_NOT_ENABLED_FOR_CARD_PROCESSING`. Turn on Advanced Credit and Debit Card in the app only if we need card-paid test orders |
| Buyer opens a dispute in the sandbox UI | **Pass**, `PP-R-JBX-10193752` (INR, $40, on the invoice payment). Visible to the API after a few minutes, in `WAITING_FOR_SELLER_RESPONSE` / `INQUIRY` |
| Escalate (seller) | Status went to `UNDER_REVIEW`, but the stage stayed `INQUIRY` and only a note was recorded |
| **`provide-evidence` with a generated PDF** | **Pass, HTTP 200.** Answers §8 Q3: our own PDFs are accepted |
| `require-evidence`, `adjudicate` | **Not yet:** `ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE`; no `adjudicate` link offered while the case is in inquiry. Next test: the buyer escalates a case to a claim in the UI, then retry. **Always follow the HATEOAS links**; never call an action PayPal doesn't offer |
| `CUSTOMER.DISPUTE.*` webhooks | **None received** for a UI-opened dispute (none in `webhooks-events` either). **Design consequence:** a poller task (`GET /v1/customer/disputes`, every few minutes from cron, and on demand in judge mode) detects new and changed disputes; the webhook is a bonus, deduplicated by dispute id |
| **Dispute create via API** | **Blocked:** `400 No permissions to set target_client_id`. PayPal's [set-up guide](https://developer.paypal.com/disputes/set-up) says the `disputes/create` scope must be added by a PayPal account manager, plus Log in with PayPal buyer consent |

**Consequence for judge mode (F8):** until the scope is granted, disputes are opened by the sandbox buyer in the PayPal UI (Resolution Center). We keep a **pool of pre-opened disputes**. "Simulate a buyer dispute" claims the next one and runs everything after creation live through the API: escalate → `require-evidence` → evidence packet → `provide-evidence` → `adjudicate`. Ask for the scope through PayPal developer support and the hackathon Discord; if it arrives, switch back to API creation.

**Day 3 (20 Oct), live on Render:** real, PayPal-signed deliveries (redelivered with the resend API) verify as `SUCCESS`; a repeat delivery is stored once (`duplicate`); an `INVOICING.INVOICE.PAID` event matched its sale by invoice id, marked it paid and recorded the payment id; the dispute poller then matched the buyer-opened dispute `PP-R-JBX-10193752` to that sale through `seller_transaction_id`. **Invoicing webhooks wrap the invoice in `resource.invoice`**; other events put the object directly in `resource`.

**Day 5 (20 Oct), live:** the app's own "Send invoice" created and sent `INV2-ACZS-3V59-57RG-6BXH` ($200, 3.9 s), the sandbox buyer paid it on PayPal's page, and the signed `INVOICING.INVOICE.PAID` webhook marked the sale paid and posted "Northwind Games paid $200" to the timeline. **Sandbox trap:** invoices addressed to an email that is not a sandbox account (e.g. `art@northwind.example`) fail at payment with "something went wrong on our end", so demo invoices are addressed to the sandbox buyer while the client's name stays on the invoice.

**Judge mode, live (20 Oct):** the sandbox buyer paid three $250 invoices (`scripts/spikes/06-pool-invoices.mjs`) and opened a "not received" dispute on each; the cron loads such disputes into a stock (`dispute_pool`). A visitor's "Simulate a buyer dispute" claimed `PP-R-LNM-10193814`; after approval the Render Workflow task `submitEvidence` (run `trn-0994gdbbu0l5plr0s739887j0`) sent `evidence-summary.pdf` + notes through provide-evidence in ~6 s and PayPal moved the case to `UNDER_REVIEW`. **Sandbox traps:** a buyer whose PayPal balance runs low gets "something went wrong on our end" at payment (top the balance up in Sandbox Accounts → Funding); buyer-opened disputes wait about 10 days for the seller, so the stock must be refilled shortly before judging.

**Lessons:** quick tunnels die when the laptop sleeps, so re-register the webhook after restarting one. Unapproved orders disappear after a few hours. One sandbox checkout failed with "Things don't appear to be working right now"; the retry uses `shipping_preference: GET_FROM_FILE`.

## 8. Open questions for the day-1 spike

1. Can a **service** order be marked "completed" through any public API, to start the 7-day release from [help129](https://www.paypal.com/us/cshelp/article/help129)? If not, the hold coach guides the seller to PayPal's "Get your money" flow. Is carrier `OTHER` with a delivery reference accepted for intangible goods?
2. ~~Does an invoice payment produce a `capture_id` usable with `/track`?~~ **Yes** (20 Oct). An invoice payment id is a capture (`GET /v2/payments/captures/{id}`), its `supplementary_data.related_ids.order_id` names the order, and `POST /v2/checkout/orders/{order}/track` accepts it (tracker `SHIPPED`), also through the Server SDK's `createOrderTracking`. The sandbox once answered the SDK with a Cloudflare bot-check page; `tracking.ts` retries that.
3. ~~Does sandbox `provide-evidence` accept PDFs we generate?~~ **Yes** (20 Oct, HTTP 200).
4. Does the sandbox MCP server still fail on `create_invoice`? This decides whether N1 uses the remote MCP or local `npx @paypal/mcp`.

## 9. What we will not touch

- **Agent Ready, Store Sync and WebMCP checkout:** gated, with no public sandbox.
- **Wallet vaulting on platform apps:** returns `NOT_ENABLED_TO_VAULT_PAYMENT_SOURCE`.
- **Payouts and Venmo.**
- **Any live credentials.**
