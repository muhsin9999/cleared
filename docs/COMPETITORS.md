# Competitors

Checked 19 Oct 2026. Re-check the [project gallery](https://paypalaihackathon.devpost.com/project-gallery) when it opens and again before submitting.

## Hackathon entries closest to Cleared

| Entry | What it does | AI | Polish | How Cleared differs |
| --- | --- | --- | --- | --- |
| [ProofPilot](https://devpost.com/software/proofpilot-r1h6s5) | **Biggest overlap.** Flags Seller Protection voids before shipping (address redirect, $750+ with no signature, digital goods), pushes tracking, then runs a dispute queue with a cited evidence pack | Gemini + Agent Toolkit recommends fight/offer/accept; a checker strikes uncited claims | Video, GitHub, Postgres | ProofPilot is built for **shipped goods**. Cleared covers **services and digital work** (deliverables + client acceptance), the **pre-invoice** check of amount against history and wording, the invoice itself, and **limitation/hold notices** |
| [PayGuard AI (merchant)](https://devpost.com/software/payguard-ai-zbsp9l) | AUP check on the product description, sales-velocity flag, pseudonymized evidence ZIP | Optional Gemini brief; rules first | Video, MIT, tests, AG Grid; **synthetic data, nothing sent to PayPal** | Cleared runs the real loop: it sends the invoice, writes tracking, submits evidence and gets a resolution in the sandbox |
| [Preflight for PayPal](https://devpost.com/software/preflight-for-paypal) | Chrome extension: 7 Seller Protection checks on a capture; writes tracking | None | Video, real sandbox dispute | No AI and no holds/limitations; order-level only |
| [Exhibit](https://devpost.com/software/exhibit-73ctq2) | Dispute desk: every sentence pinned to a record, Bates-stamped PDF, recommends giving up on weak cases | GPT-5.6 + checker, "52/52" eval | **Highest polish:** live demo, AG Studio, evals | Chargebacks only. **Don't compete on dispute-desk polish; lead with prevention and limitations.** Borrow the idea of a published eval score. |
| [Dispute Defender](https://devpost.com/software/dispute-defender-m95j38) | 9-step agent run, evidence PDF, approve-and-send | Claude Haiku | Live demo, a sandbox case won | Reacts only after a dispute exists |

**Other dispute desks:** [Dispute Copilot](https://devpost.com/software/dispute-copilot), [Rebuttal](https://devpost.com/software/rebuttal-8qxkf0), [RebuttalForge](https://devpost.com/software/rebuttalforge). **No entry handles limitation or 180-day-hold notices, new-seller onboarding, or account health.**

## Market products

| Product | Covers | Price | Gap |
| --- | --- | --- | --- |
| Chargeflow | Automated chargeback/PayPal dispute responses | About 25% of recovered funds | Acts after the loss; built for volume merchants, not first-sale freelancers |
| Disputifier, Justt, Chargebacks911 | Chargeback automation | 20–35% of wins, or enterprise pricing | Shopify/enterprise focus; nothing on limitations |
| [terms.law Payment Freeze Hub](https://terms.law/Payment-Freeze-Hub/) | Lawyer demand letters for frozen PayPal funds | About $575 per letter | Only after the 180-day hold has happened |
| Amazon-seller appeal services (an analog) | Appeal drafting after a suspension | $1,500–3,500 | Shows people pay four figures for an appeal; nobody offers this for PayPal sellers |
| PayPal's own tools | Seller Protection, tracking upload, "Get your money", Resolution Center, Business Resource Center | Free | Scattered and reactive: no pre-sale check, no locker, no drafted limitation reply |

## The differentiator (use this sentence everywhere)

> **Dispute tools act after a buyer files. Cleared protects a new seller across the whole sale:** it checks the sale before the invoice exists, sends a clear PayPal invoice, keeps the proof as the work happens, and when PayPal limits the account or a buyer disputes, it assembles a cited packet in under a minute for the seller to approve. A lawyer charges $575 for the same letter.

## What to borrow from competitors

1. **A published eval score** (from Exhibit) for credibility.
2. **A checker that strikes uncited claims** (several entries have one; it's now table stakes).
3. **A live, keyless demo** (Dispute Defender, Exhibit). Judges clearly reward these.
