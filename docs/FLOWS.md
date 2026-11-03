# Pages, sign-in and user flows

This document decides **who uses Cleared, how they get in, every page, and the exact path through the product**. Every page must work for two audiences at once: **Maya (the real user)** and **a judge with three minutes and no context**.

## 1. Who uses it and how they get in

| Role | Account? | How they get in | What they can do |
| --- | --- | --- | --- |
| **Seller** (Maya) | Yes: a Cleared workspace linked to a PayPal business account | **Demo:** one click, "Try the live demo", which signs them in as Maya with a signed session cookie.<br>**New seller:** "Start as a new seller" creates a fresh demo workspace and runs onboarding. | Everything in the app |
| **Client / buyer** (the studio paying Maya) | **No Cleared account** | (1) Pays on **PayPal's hosted invoice page** through the link in PayPal's invoice email.<br>(2) Confirms delivery on Cleared's public **acceptance page** via a private tokenized link. | Pay; confirm receipt; report a problem |
| **Judge** | No | Same as the seller demo, plus a **Demo panel** for sandbox actions that would normally come from the buyer or PayPal | Everything, plus the simulation buttons |
| **PayPal** | n/a | Sends verified webhooks; receives API calls | — |

**Decisions and why:**
- **No sign-up form and no passwords in the demo.** Judges won't create accounts, and the rules require free, keyless judge access.
- **No email magic links.** Judges have no inbox for them.
- **"Log in with PayPal" + Partner Referrals** is the real-world onboarding. It goes in "What's next" and is shown as a disabled, explained option on the sign-in card. Multi-merchant onboarding is out of scope for the hackathon.
- **One sandbox business account** backs every demo workspace. Cleared tags its own PayPal objects with the workspace ID (invoice `reference`, order `custom_id`), so each workspace sees only its own sales.
- **Every visitor gets a private copy of Maya's workspace** (tag `ada-<random>`), so judges never see each other's changes; a returning visitor keeps theirs. A nightly cron deletes copies older than 48 hours, with their R2 files. "Reset demo" in Settings restores the visitor's own copy instantly.

## 2. Route map

```
PUBLIC
/                         Landing
/accept/[token]           Client acceptance page (no login)
/legal                    Not affiliated with PayPal · privacy · how the AI is used

SELLER APP  (requires session; redirect to / if none)
/onboarding               3 steps (only for "new seller" workspaces)
/home                     Account health: the hub
/sales                    All sales
/sales/new                Step 1 Describe → Step 2 Pre-flight check → Step 3 Fixes
/sales/[id]/invoice       Invoice review & send
/sales/[id]               Sale detail: Proof locker · Hold coach · Activity
/cases                    Disputes + PayPal notices
/cases/[id]               Case room (dispute → evidence packet → approve)
/notices/new              Notice reader (paste/upload a PayPal email)
/notices/[id]             Notice result (phishing verdict, requirements map, draft reply)
/activity                 Full PayPal event timeline
/settings                 PayPal connection · webhook health · demo reset · AI audit log

ALWAYS AVAILABLE IN DEMO MODE
Sandbox panel (drawer from the top bar): pay an invoice, open a dispute, decide it as PayPal, reset. Home brings in the first dispute by itself.
```

## 3. Navigation

- **Desktop:**
  - left sidebar: Home · Sales · Cases · Activity · Settings, with a primary **New sale** button at the top;
  - a top bar holds the **hold-status island** ("$400 releases in 6 days"), a notifications bell and the workspace menu.
- **Mobile:** bottom tab bar with the same items; **New sale** is a floating button. Sellers check money on their phones, so every page must work at 390px wide.
- **Notifications:** in-app only, as a toast when a webhook arrives plus an "Action needed" card on Home. Email digests are out of scope (N3).

## 4. Page by page

Each page lists its purpose, contents, primary action and states. **Every page has loading, empty, error and success states designed, not left to defaults.**

### `/` Landing
- **Purpose:** in 10 seconds, who it's for, what it does, and a way in.
- **Contents:**
  - headline "Get paid, and stay paid.", with the Animated Beam Maya → cleared → PayPal;
  - three proof points (Check before you sell · Keep the proof · Answer PayPal in minutes);
  - one real quote from the evidence;
  - "How it works" in 4 steps;
  - footer: "Works with PayPal (sandbox). Not affiliated with PayPal."
- **Primary action:** **Try the live demo** (as Maya). Secondary: **Start as a new seller**.
- **States:** a "waking up…" skeleton only if the server is slow (it shouldn't be, on Starter).

### `/onboarding` (new-seller workspaces only; three steps with a progress bar)
1. **Connect PayPal:** shows "Sandbox business account connected ✓" with the account email. The disabled "Log in with PayPal (coming soon)" option explains real onboarding.
2. **Your work:** what you sell (services / digital / physical), typical price, typical delivery time, whether you take deposits. This sets the risk baseline used by the pre-flight check. Skippable, with defaults.
3. **First-sale checklist:** what PayPal looks for (confirmed bank, primary phone, tracking or completion, low disputes), with links. Then **Go to home**.

### `/home` Account health (the hub)
- **Purpose:** "Am I OK, and what do I do next?"
- **Contents:**
  - **Action needed** cards at the top: a dispute opened, a notice to answer, proof missing on a paid sale. Each has a single button.
  - Bento:
    - **Funds in flight** (NumberFlow);
    - **Next release** (days);
    - **Proof coverage** (% of paid sales with acceptance, files or tracking);
    - **Open cases**.
  - Recent sales (5).
  - Live activity (last 8 events).
- **Empty state (new seller):** the first-sale checklist plus a large **Check your first sale** button.
- **Primary action:** whatever the top action card says. Otherwise **New sale**.

### `/sales` All sales
- **Contents:** a table/list with client, amount, status (Draft · Sent · Paid · Delivered · Accepted · Released · Disputed), proof coverage dots and expected release date. Filter by status.
- **Empty state:** "No sales yet" with **Check your first sale**.

### `/sales/new` New sale: Describe → Check → Fix (wow 1)
- **Step 1 Describe:**
  - Client name and email.
  - Amount and deposit/full.
  - Kind (service, digital, physical).
  - A free-text "What are you delivering?"
  - Delivery date.
  - Example chips to fill a sample.
- **Step 2 Check:** the scan animation while the J1 workflow runs (about 5–10 seconds). Checks stream in. Copy: "Checking against your history and PayPal's published rules."
- **Step 3 Fix:**
  - Findings grouped by severity. Each has the reason, the PayPal rule it relates to (a link to [KNOWLEDGE.md](KNOWLEDGE.md) rule IDs) and a **one-click fix**, such as adding a delivery date, clarifying the description or splitting into a deposit and a final invoice.
  - The score updates live as fixes are accepted.
- **Primary action:** **Create invoice** (allowed at any score; risk is explained, not blocked).
- **Error states:**
  - **AI failed:** deterministic checks still show, with "AI suggestions unavailable, retry".
  - **Validation:** inline field errors.

### `/sales/[id]/invoice` Invoice review & send
- **Contents:**
  - A paper-style preview, showing the AI-written line items, terms, delivery date and revision and refund policy, with every field editable inline.
  - A side panel "Why this wording helps", linking each clause to a finding.
- **Primary action:** **Send with PayPal**. A confirmation dialog shows exactly what PayPal will email the client. Then Invoicing create → send.
- **States:**
  - Sending (progress).
  - **Sent:** the invoice number and PayPal link, then a redirect to the sale detail.
  - **PayPal error:** shows PayPal's message in plain English with **Retry**. The draft is kept.

### `/sales/[id]` Sale detail
- **Header:** client, amount, a status stepper (Sent → Paid → Delivered → Accepted → Released) and the hold coach card ("Releases in 7 days after you mark it completed, so do it now", with guided steps or **Add tracking** for goods).
- **Tabs:**
  1. **Proof locker:**
     - **Deliverables:** a dropzone limited to JPG/PNG/GIF/PDF, ≤10 MB, matching PayPal's evidence rules.
     - **Client acceptance:** a status card with **Copy acceptance link** / **Send via invoice note**, and the timestamped record once confirmed.
     - **Messages:** paste or upload agreed-scope messages.
     - **Tracking** (physical): carrier and number → `/track`.
     - A coverage meter.
  2. **Activity:** PayPal events for this sale only.
  3. **Invoice:** the read-only invoice and PayPal link.
- **States:**
  - **Upload failed:** retry, file kept locally.
  - **Tracking rejected:** PayPal's reason shown.
  - **Client reported a problem:** a caution banner with their note and "Resolve before it becomes a dispute".

### `/accept/[token]` Client acceptance (public, no login, mobile-first)
- **Contents:** "Maya Brooks marked your order as delivered", the sale summary (what, amount, invoice number) and the file list with previews where permitted.
- **Actions:**
  - **Yes, I received the work.** Records the time, IP and user agent, and shows a thank-you.
  - **Something's wrong.** A short form; Maya sees it immediately, as an early warning before a PayPal dispute.
- **States:**
  - **Token expired or used:** a friendly message.
  - **Already confirmed:** shows the confirmation record.

### `/cases` Cases
- **Two sections:** **Disputes** (from PayPal webhooks: reason, amount, response deadline countdown, packet status) and **PayPal notices** (pasted or uploaded).
- **Primary action:** **I got a PayPal email**, which goes to `/notices/new`.
- **Empty state:** "No open cases. Your proof coverage is 92%."

### `/cases/[id]` Case room (wow 2)
- **Left column:** the dispute summary in plain English, the buyer's claim (shown as data), the deadline countdown and the PayPal status.
- **Main area:**
  1. **Investigation:** the Render Workflow progress (gather proof → draft → check claims), showing task names, any retry, and elapsed time.
  2. **Packet:** the assembly animation, then the recommendation (fight / offer / accept) with its rationale.
     - Claims are editable. Each has exhibit chips; clicking one opens the exhibit.
     - "Couldn't verify" claims are listed separately as missing evidence, with **Upload now**.
  3. **Approve:** a dialog summarising exactly what PayPal will receive (evidence types, files, notes). Then **Approve & submit**.
- **After submit:** a "Submitted to PayPal ✓" timeline, then waiting, then the resolution.
- **States:**
  - Workflow running; workflow retrying; AI failed (template packet).
  - **Not accepting evidence yet:** explains why; judge mode offers "Move to seller response".
  - Submitted; resolved for the seller or the buyer.
- **Audit:** "Why did Cleared say this?" opens the AI audit for this packet.

### `/notices/new` → `/notices/[id]` Notice reader
1. **Paste or upload** the email text, a screenshot or a PDF.
2. **One question:** "Do you see this same message in your PayPal Resolution Center?" (Yes / No / Not sure.)
3. **Phishing verdict first.** If it's likely phishing: a red verdict, the signals found, and "forward to phishing@paypal.com". Stop.
4. **If genuine:**
   - a requirements map ("PayPal asks for X → you have Exhibit 3 ✓ / missing ✗");
   - a draft reply;
   - a checklist with **Copy reply** / **Download evidence ZIP** and "Upload these in your Resolution Center". This last step is manual by necessity, and the page says so honestly.
   - **Mark as done.**

### `/activity` Activity
- **Contents:** the full verified webhook timeline: event name (mono), plain-English line, sale link, a "simulated" tag in demo mode, and the raw JSON on expand. Filter by type.

### `/settings` Settings
- **PayPal connection:** account, environment (sandbox) and enabled features.
- **Webhook health:** last event received, failures and signature verification status.
- **AI audit log:** every AI call with model, effort, result and approver.
- **Demo:** **Reset demo data**, speed mode for recording.
- **About:** "Not affiliated with PayPal", data handling.

### Demo panel (drawer, demo mode only)
- **Buttons, each with one plain sentence explaining what it simulates and which API it calls:**
  1. **Simulate buyer dispute** on a paid sale (sandbox dispute API).
  2. **Move to seller response** (`require-evidence`).
  3. **Resolve in Maya's favour** (`adjudicate`).
  4. **Send a sample PayPal notice** (genuine / phishing).
  5. **Reset demo**.
- **Pay as the client:** paying an invoice needs the sandbox *buyer* to log in on PayPal's page. The panel shows the sandbox buyer login to copy and an **Open invoice in PayPal** button. Seeded sales are already paid, so judges can skip this step.

## 5. The journeys

**J1 Judge, 3 minutes (most important)**
1. `/`: **Try the live demo**.
2. `/home` (as Maya) with a 3-step guided tour: "This is Maya's account health → start a sale → see a dispute handled." The **Demo panel** is pulsing.
3. **New sale** → describe (sample chip) → scan → accept fixes → **Create invoice** → send. Real Invoicing API, sent to the sandbox buyer.
4. Open the seeded **paid** sale → proof locker already complete → **Demo panel: Simulate buyer dispute**.
5. Toast "Dispute opened" → `/cases/[id]` → investigation runs → packet assembles → **Approve & submit**.
6. **Demo panel: Resolve in Maya's favour** → resolved event in the timeline.

**J2 New seller's first sale:** `/` → Start as new seller → `/onboarding` 1–3 → `/home` (empty state) → New sale → check → fix → invoice → send → (client pays on PayPal) → paid toast → sale detail → upload work → send acceptance link → client accepts → hold coach: mark completed → **Released**.

**J3 Physical goods variant:** as J2, but the locker shows **Add tracking**. PayPal tracking is posted, and the hold coach says "releases about 24h after delivery is confirmed".

**J4 Dispute:** webhook → toast + Home action card → case room → investigation → review/edit claims → upload any missing evidence → approve → submitted → resolved. Deadline reminders show on Home.

**J5 PayPal email:** Cases → I got a PayPal email → paste → Resolution Center question → phishing verdict → (if genuine) requirements map → draft → manual upload checklist → done.

**J6 Early warning:** client clicks **Something's wrong** on the acceptance page → Maya gets a caution banner and toast → she resolves it with the client, so the dispute never happens.

## 6. Copy and tone rules

- Plain English, second person ("Your $400 is on hold for 7 more days"). Never PayPal jargon without an explanation.
- Never promise outcomes: "helps", "prepares", "drafts". Never "guarantees" or "unlocks".
- Every AI output is labelled ("Drafted by Cleared AI · check before sending").
- Money and approval buttons say exactly what happens: "Send invoice to studio@… via PayPal", not "Continue".

## 7. How we validate the flow before building it all

1. **Day 2:** clickable wireframes of J1 using the styleguide components with fake data. Time it: a judge must reach the resolved dispute in **under 3 minutes**.
2. **Day 2:** show the clickable wireframes to two people who've never seen it (friends, Discord). Note where they hesitate, and fix those copy and layout points before the real build.
3. **Day 10:** Playwright runs J1 automatically, and that test guards the demo every day after.
