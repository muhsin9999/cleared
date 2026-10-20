# Product spec

## The user

**Ada Okafor, 26, freelance illustrator in Atlanta.** She has a PayPal Business account with three small past sales. A studio offers her a **$400 commission**, her biggest ever. A sudden jump on a young account is exactly the pattern PayPal names as "higher-risk activity" ([help534](https://www.paypal.com/us/cshelp/article/why-is-my-paypal-account-limited-help534)). New sellers' payments can be held for up to 21 days ([HELP848](https://www.paypal.com/us/cshelp/article/HELP848)). And if PayPal ends service, the balance is held for **180 days** and "the decision can't be overturned" ([pcc191](https://www.paypal.com/us/cshelp/article/were-unable-to-continue-offering-our-services-pcc191)).

**Secondary users:**
- Small physical-goods sellers, such as a ceramicist shipping mugs.
- Creators taking first sponsorships.

**Why it matters (evidence):**
- CFPB lists **3,040** "trouble accessing funds" and **1,550** account-management complaints against PayPal from Jan 2025 to Oct 2026.
- About one-third of the top r/paypal posts of the past year are limitations or holds.
- A lawyer's demand letter for frozen funds costs about **$575**.

See [../../Paypal Hackaton/12-winning-portfolio.md](../../Paypal%20Hackaton/12-winning-portfolio.md) and [COMPETITORS.md](COMPETITORS.md).

## The promise

**"Get paid, and stay paid."** Cleared makes an honest seller's activity legible to PayPal **before** anyone asks. When PayPal does ask, it assembles the answer in minutes, and the seller approves it.

We **never** claim to predict or reverse PayPal's decisions. Cleared prepares, documents and drafts; the seller decides; PayPal decides.

## Scope

### Must ship (the submission)

| # | Feature | What happens | PayPal |
| --- | --- | --- | --- |
| F1 | **Pre-flight check** (wow 1) | Ada describes the job ("$400 character sheet, 50% upfront, delivered as PNG in 10 days"). Cleared checks it against her history and PayPal's published triggers: size versus past sales, vague wording, delivery time, refund terms, prohibited categories, missing proof plan. The result is a readiness score plus concrete fixes. | Reads history (Transaction Search, cached; invoices) |
| F2 | **Clear invoice** | Applying the fixes produces a PayPal invoice with specific line items, delivery date, revision policy and refund terms. Ada reviews it and sends. | Invoicing v2 create → send; `INVOICING.INVOICE.PAID` webhook |
| F3 | **Proof locker** | Each sale has a locker holding deliverables (files), a **client acceptance link** (the client clicks "I received the work", which is timestamped with IP and user agent), messages and, for goods, tracking. | Orders v2 + **Add Tracking** (`/v2/checkout/orders/{id}/track`) for goods |
| F4 | **Hold coach** | For each payment: its status, the days until expected release, and the one action that speeds it up. That is "add tracking" for goods and "mark service completed" for services ([help129](https://www.paypal.com/us/cshelp/article/help129)). | Tracking API; deep-link guidance where no API exists |
| F5 | **Live timeline** (wow 3) | Every verified PayPal webhook appears live: paid, captured, dispute opened, resolved. Each entry is in plain English with the raw event available. | Webhooks (verified) |
| F6 | **Dispute → evidence packet** (wow 2) | When `CUSTOMER.DISPUTE.CREATED` arrives, a Render Workflow gathers the dispute, invoice, locker items and tracking. The AI drafts a packet where **every claim cites an exhibit**. A checker removes any claim it can't verify. Ada edits and approves, then Cleared submits through `provide-evidence`. | Disputes v1 get → provide-evidence (multipart) |
| F7 | **Limitation notice reader** | Ada pastes or uploads a limitation or hold email or screenshot. Cleared **first checks for phishing**: is it in the Resolution Center? does the sender look genuine? It then maps each PayPal request to locker evidence, lists what's missing, and drafts the response. Ada uploads it herself in PayPal, because there is no public API for this. | None; honest manual hand-off |
| F8 | **Judge mode** | One click: "Enter as Ada (demo)". Then "Simulate a buyer dispute" takes a real sandbox dispute (opened by the sandbox buyer; see [PAYPAL.md](PAYPAL.md) §7b), and the whole loop after it runs live. | Sandbox dispute create, require-evidence, adjudicate |

### Nice to have (only after must-ship is done)

- **N1:** "Ask Cleared" read-only assistant over Ada's PayPal data through the PayPal Agent Toolkit / MCP server. It shows off the toolkit for DevRel judges and is kept off the critical path.
- **N2:** Elastic hybrid search over the policy knowledge base for clause-level citations.
- **N3:** Weekly account-health digest email.
- **N4:** Client acceptance via a PayPal-branded receipt page with a QR code (Invoicing `generate-qr-code`).

### Explicitly out of scope

- Multi-merchant onboarding (Partner Referrals). Cleared runs against one sandbox business account per deployment. Say so in the README.
- Any claim of predicting PayPal's risk score.
- Live (production) money.

## Screens

> Full page specs, sign-in decisions, routes and journeys are in **[FLOWS.md](FLOWS.md)**. This list is the summary.

1. **Landing:** headline, an animated beam (Seller → Cleared → PayPal), "Enter as Ada (demo)".
2. **Home / Account health:**
   - a bento of funds in flight, days to next release, proof coverage % and open cases;
   - the live timeline.
3. **New sale → Pre-flight check:** a description box, then the animated scan, then a findings list with one-click fixes.
4. **Invoice review:** a paper-style invoice preview, edits, and a **Send with PayPal** confirmation.
5. **Sale detail / Proof locker:**
   - files, the acceptance link, the tracking form;
   - hold coach card;
   - a timeline filtered to this sale.
6. **Client acceptance page (public):** "Did you receive the work from Ada?" with Approve, plus an optional note.
7. **Case room (dispute):** dispute summary, response deadline countdown, the evidence packet assembling, editable claims with exhibit chips, then **Approve & submit**.
8. **Notice reader:** upload or paste → phishing verdict → requirements map → draft reply → checklist.
9. **Settings:** sandbox connection status, webhook health, and the "reset demo data" control.

## Error and edge states (judges test unhappy paths)

- **PayPal API fails or times out:** retry through the Workflow, keep the state visible ("PayPal didn't respond; retrying 2/3"), never lose a draft.
- **Webhook signature fails:** reject it, log it, show it in the Settings webhook-health panel. Simulator events go to a labelled dev path.
- **The dispute isn't in `WAITING_FOR_SELLER_RESPONSE`, or has no `provide-evidence` link:** disable submit and explain why. Offer the `require-evidence` sandbox helper in judge mode.
- **Evidence files:** files over 10 MB or of the wrong type are blocked at upload (PayPal accepts JPG/GIF/PNG/PDF only, 50 MB per case).
- **The AI refuses or the output fails validation:** show "Draft needs your input" and fall back to a template packet built from the locker. Nothing is ever sent unapproved.
- **Phishing-like notice:** a red verdict plus "forward to phishing@paypal.com". Cleared does not draft a reply.
- **Empty states:** a new seller with no history gets a friendly first-sale checklist.

## Real versus simulated (said honestly in the video and README)

| Real (PayPal sandbox) | Simulated or manual |
| --- | --- |
| Invoices, payments, orders, captures, tracking, disputes, evidence submission, dispute resolution, webhooks | Account limitation notices: no API exists, so they are pasted or uploaded. The "mark service completed" release step is guided in PayPal's UI (still being checked; see [PAYPAL.md](PAYPAL.md) §8) |

## Success metrics shown in the demo

- **Time to a cited evidence packet:** under 60 seconds, against the hours of manual assembly sellers describe.
- **Proof coverage per sale:** acceptance, files and tracking, as a percentage.
- **Every packet claim backed by an exhibit:** 100%, enforced by the checker.
