# Presentation

## What judges actually get

1. **A YouTube video under 3 minutes.** This is the main way most judges will experience Cleared, so it carries Presentation and much of Design.
2. **A live link** (`cleared-web.onrender.com`) with **"Try the live demo"**: no sign-up, no keys. Home opens on a **"Start here"** card with three jobs: (1) "Open the dispute" claims a real sandbox dispute and opens the case room, where the agent works live; (2) "Check the sale" opens the $400 sample in the pre-flight; (3) "Check the email" opens the phishing sample. "Play the client" in the top bar holds the other side's actions (pay, dispute, PayPal's decision, start over). It must stay live until **15 Dec**.
3. **A public GitHub repo** with an MIT licence, README, architecture diagram, `.env.example`, eval results and sponsor sections.
4. **The Devpost write-up:** problem, user, what it does, how it's built (PayPal APIs and AI named exactly), challenges, what's next.
5. **The Postman collection** link.

## Video script (target 2:45)

| Time | Screen | Narration (approximate) |
| --- | --- | --- |
| 0:00–0:15 | Reddit and CFPB quotes fading in: "froze my money for 6 months", "limited after my first art commission" | "Every year thousands of honest new sellers get paid on PayPal, and then can't touch the money. One in three of the top r/paypal posts this year is about a hold or limitation." |
| 0:15–0:25 | Landing page: Animated Beam Ada → cleared → PayPal | "Meet Ada, an illustrator about to take her biggest commission ever: $400. Cleared helps her get paid, and stay paid." |
| 0:25–0:55 | **Wow 1:** pre-flight scan. Findings stream in, Ada taps the fixes, the score climbs from 38 to 94 | "Before the invoice exists, Cleared checks the sale against her history and PayPal's own published triggers: a sudden jump, vague wording, no delivery date. One tap fixes each one." |
| 0:55–1:15 | Invoice preview → Send → PayPal sandbox invoice paid by the client → timeline lights `INVOICING.INVOICE.PAID` | "Cleared writes a clear PayPal invoice through the Invoicing API. The client pays, and the verified webhook lands on her timeline." |
| 1:15–1:35 | Proof locker: upload PNGs, the client clicks "I received the work", the hold coach shows "releases in 7 days" | "As she delivers, Cleared keeps the proof: files, the client's timestamped acceptance and, for goods, tracking pushed straight to PayPal." |
| 1:35–2:15 | **Wow 2:** "Simulate a buyer dispute" → `CUSTOMER.DISPUTE.CREATED` → Render Workflow run view (tasks chaining, one retry) → the packet assembles, citations light up, the stamp seals it → Ada edits one line → **Approve & submit** → `provide-evidence` returns 200 | "Two weeks later, the client disputes. A Render Workflow investigates. GPT-5.4 mini drafts a packet where every sentence cites an exhibit, and a checker strikes anything it can't prove. Nothing goes to PayPal until Ada approves." |
| 2:15–2:30 | Sandbox adjudication → `CUSTOMER.DISPUTE.RESOLVED`, "Closed in your favour" | "Resolved in her favour, in the real PayPal sandbox." |
| 2:30–2:40 | Notice reader: a fake limitation email flagged as phishing, then a real one mapped to evidence | "And if PayPal limits her account, Cleared spots phishing first, then maps every request to her proof." |
| 2:40–2:45 | Logo stamp plus "PayPal Invoicing · Orders · Tracking · Disputes · Webhooks · OpenAI · Render Workflows" | "Cleared. Get paid, and stay paid." |

**Rules for the recording:**
- Say "sandbox" honestly.
- Show real API responses: briefly expand the raw webhook JSON once.
- Use captions throughout (burned in).
- No copyrighted music; use YouTube Audio Library or silence plus voice.
- No PayPal logo except on PayPal's own screens.
- Record the voice separately for a clean take.

## Devpost write-up skeleton

- **Inspiration:** the CFPB figures, r/paypal quotes, $575 demand letters.
- **What it does:** F1–F8 in plain English.
- **How we built it:**
  - PayPal: Invoicing v2, Orders v2 + Add Tracking (Server SDK, built with the APIMatic Context Plugin), Disputes v1, Webhooks.
  - OpenAI `gpt-5.4-mini` with strict structured outputs and a deterministic claim checker.
  - Render web, Workflows and cron; Neon Postgres; Cloudflare R2; Next.js, shadcn/ui and Motion.
- **Challenges:** simulator webhooks can't be verified; tracking-endpoint deprecation; no limitation API (honest manual hand-off).
- **Accomplishments:** the eval numbers.
- **What's next:** multi-merchant via Partner Referrals; PayPal-native hold API partnership.
- **Built with:** tags.
- **Try it:** live link, judge instructions, Postman, repo.

## Submission checklist

- [ ] Video public on YouTube, under 3:00, captions on
- [ ] Live link works in a private window, and all three "Start here" jobs complete end to end
- [ ] Judge instructions in Devpost "Testing instructions": the link, "click Try the live demo, then follow Start here", the expected flow, and sandbox buyer credentials only if the backup path needs them
- [ ] Repo public, MIT licence detected, README complete, no secrets (`git log -p | grep -i secret` check)
- [ ] Render credits confirmed through 15 Dec; services on paid always-on plans
- [ ] APIMatic claim form submitted; README section present
- [ ] Postman collection public
- [ ] Devpost: honorable-mention lane Most Impactful; sponsor: Render (and APIMatic)
- [ ] **Submitted (not draft)** by 1 Nov; final edit before 12 Nov 12:00 PST (9:00 p.m. Lagos)
