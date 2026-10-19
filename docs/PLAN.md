# Build plan: from zero to submitted on 1 Nov 2026

**Order of priority when time runs short:** a working sandbox loop beats polish, polish beats extra features, and nice-to-haves (N1–N4) come only after **Submitted**.

| Day | Date | Goal | Done when |
| --- | --- | --- | --- |
| 1 | Mon 20 Oct | **Kill tests / spikes** | Sandbox setup:<br>• US sandbox business and personal accounts, app features enabled, webhook registered via tunnel<br><br>Scripts prove each call works:<br>• invoice create → send → paid webhook<br>• order → capture → `/track`<br>• dispute create (API) → require-evidence → provide-evidence (PDF) → adjudicate<br>• verify-signature on a real event<br><br>Platform:<br>• Render Workflow "hello" task triggered from a script<br>• OpenAI structured output returns<br><br>Also answer [PAYPAL.md](PAYPAL.md) §8. **If any call fails, fix it or redesign that feature today.** |
| 2 | Tue 21 Oct | **Skeleton deployed** | Next.js + Tailwind v4 + shadcn themed with Ledger tokens; `/styleguide`; Drizzle schema (sellers, sales, invoices, proofs, events, disputes, packets, approvals, audit); `render.yaml` with web, workflow, cron and postgres **deployed and live**; seed script for Ada; **clickable J1 wireframe timed under 3 min and shown to 2 fresh people** ([FLOWS.md](FLOWS.md) §7) |
| 3 | Wed 22 Oct | Webhooks + timeline (F5) | Verified webhook route, idempotent store, live timeline with plain-English mapping, simulator path in demo mode |
| 4 | Thu 23 Oct | Pre-flight (F1) | Deterministic history stats + J1, findings UI with one-click fixes, the **scan animation** |
| 5 | Fri 24 Oct | Invoice (F2) | J2 → paper-style preview → Invoicing create/send → paid webhook updates the sale |
| 6 | Sat 25 Oct | Proof locker (F3) + hold coach (F4) | R2 presigned uploads (≤10 MB, JPG/PNG/GIF/PDF), public acceptance page with timestamped record, tracking form → `/track` via the Server SDK (APIMatic plugin), hold coach card |
| 7 | Sun 26 Oct | Dispute workflow (F6), part 1 | `onDisputeCreated → gatherProof → draftPacket (J4 tool loop, read-only tools) → checkClaims` on Render Workflows; packet stored with audit |
| 8 | Mon 27 Oct | Dispute workflow (F6), part 2 | Case room UI: **packet assembly animation**, editable claims, approval → `submitEvidence` task → multipart provide-evidence → resolution webhook |
| 9 | Tue 28 Oct | Notice reader (F7) + judge mode (F8) | J3 with phishing check first; "Simulate a buyer dispute" button runs the full loop; nightly reset cron |
| 10 | Wed 29 Oct | Unhappy paths + evals | Every error state in [PRODUCT.md](PRODUCT.md); Vitest evals (pre-flight, phishing, claim checker); one Playwright golden-path test |
| 11 | Thu 30 Oct | Design pass + accessibility | Spacing, empty states, motion timing, reduced motion, contrast, keyboard path; mobile check |
| 12 | Fri 31 Oct | Video + docs | Record and edit the video ([DEMO.md](DEMO.md)); README with architecture, eval numbers and sponsor sections; Postman collection; APIMatic form |
| 13 | Sat 1 Nov | **SUBMIT** | Devpost submitted (not draft), live link tested in a private window |
| — | 2–3 Nov | Buffer | Fix anything that broke; then move to **Lifeline** |
| — | to 12 Nov | Optional | N1 "Ask Cleared" via the PayPal MCP/Agent Toolkit, N2 Elastic; improve the video; re-check competitors |

## Daily rule

End each day with the app **deployed** and the golden path still working. Commit small and often, mentioning the APIMatic plugin in commits where it was used.

## Risks and responses

| Risk | Response |
| --- | --- |
| Sandbox dispute API won't create disputes | Fall back to Resolution Center cases opened by the sandbox buyer. Pre-create a few cases for judges. |
| `provide-evidence` rejects generated PDFs | Submit PNG exhibits plus notes; keep the PDF as a download |
| Render Workflows beta issue | Keep task code callable in-process behind a flag. Workflows stays the main path, so the prize claim is still true. |
| AI refusals, weak citations or latency | Template packet fallback; cache demo outputs; move J4 alone to a stronger GPT model |
| Running behind on day 8 | Cut F7 to a text-paste version and N items; never cut F6 or F8 |
