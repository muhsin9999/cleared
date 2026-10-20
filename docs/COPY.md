# Landing page copy ledger

Every user-visible line on `/` (src/app/(public)/page.tsx and src/components/marketing/*), why it is there, and where it comes from. If a line is not in this table, it should not be on the page.

**Status key**
- **verified fact**: checked against a fetchable source on 20 Oct 2026.
- **seller's own words**: an exact quote from a public post, with its URL. Quote marks are used only for these and for PayPal's own wording.
- **our promise**: what Cleared does. It must match the build. Re-check before submission.
- **illustrative**: demo data. Taken from the app's seed (src/db/seed.ts) or sample sale (src/app/(app)/sales/new/new-sale-flow.tsx), never invented for the page.

## Voice of the customer: what sellers actually say

All from the r/paypal Atom feed (top posts, past year) captured 19 Oct 2026 into the research scratchpad (`painA/rss/paypal.xml`). Reddit returned 403 to direct fetches on 20 Oct, so the wording is from the feed copy of each post. It is self-selected anecdote, not a sample.

| # | Exact words | Who | Source |
| --- | --- | --- | --- |
| V1 | "paypal immediately limited my account once their payment of 100 usd went through" | artist, first commission invoice | https://www.reddit.com/r/paypal/comments/1vsg48l/paypal_banned_my_business_account_after_first_art/ |
| V2 | "Its my first business transaction in paypal business" / "Im not going to wait 6 months just to get my money." | same | same |
| V3 | "I submitted everything they requested, including my ID, screenshots of conversations with clients showing WIPs, completed artwork, and proof that I was doing legitimate freelance commissions." | freelance digital artist | https://www.reddit.com/r/paypal/comments/1vhx32n/were_no_longer_offering_paypal_services_for_this/ |
| V4 | "We’re no longer offering PayPal services for this account" (the email sellers quote back) | post titles, twice in Aug 2026 | 1vhx32n above; https://www.reddit.com/r/paypal/comments/1w2hjvm/were_no_longer_offering_paypal_services_for_this/ |
| V5 | "PayPal says I can access my money only in 6 months (180 days), which is so far away it sounds like never." / "It's my only source of income." | 3D artist on Patreon, $1,293 balance | https://www.reddit.com/r/paypal/comments/1ot7xb1/paypal_banned_me_permanently_after_getting_my_1k/ |
| V6 | "it wasn't really like an astronomical amount of money, just 50 pounds" | freelance video editor, Philippines | 1w2hjvm above |
| V7 | "I know this has been happening to a lot of artists lately" | artist doing commissions | https://www.reddit.com/r/paypal/comments/1tqb2je/paypal_banned_for_doing_commissions/ |
| V8 | "I was told the decision could not be reversed, but no specific reason was provided." | new freelance digital artist | https://www.reddit.com/r/paypal/comments/1vpsx9k/paypal_closed_my_account_right_after_i_submitted/ |
| V9 | "Everyone was saying to wait six months and I can't do that, I needed my money now." | animator and illustrator, Argentina | https://www.reddit.com/r/paypal/comments/1p9x2wm/i_was_able_to_get_my_permanently_limited_account/ |
| V10 | "froze $26,000 from a legitimate customer payment" / "even provided invoices, texts between the customer and I" | US small business | https://www.reddit.com/r/paypal/comments/1v0uq33/help_paypal_just_locked_20k_from_our_small/ |
| V11 | "The product was shipped, tracking was provided, and the item has now been delivered for 5 days. Despite that, PayPal is still holding my funds" | seller, $7,000 sale | https://www.reddit.com/r/paypal/comments/1tn5qh7/release_funds_denied/ |
| V12 | "PayPal’s AI helper is completely useless for anything beyond generic copy and paste responses." | same | same |
| V13 | "it’s usually small things in the business setup, website, refund policy, product wording, etc that trigger automated flags." | self-described payment-risk worker (unverified) | https://www.reddit.com/r/paypal/comments/1pagw80/i_work_in_payment_risk_compliance_ama_stripe/ |
| P1 | "we hold the initial payments you receive for up to 21 days" | PayPal Help Center | https://www.paypal.com/us/cshelp/article/HELP848 (KNOWLEDGE K1) |
| P2 | "checking whether the product or service provided has already been sent to the buyer, and this will help speed up the release." | PayPal Help Center | HELP848 (K5, K7) |
| P3 | "This decision can't be overturned." / "Any money in your PayPal account will be held for 180 days" | PayPal Help Center | https://www.paypal.com/us/cshelp/article/were-unable-to-continue-offering-our-services-pcc191 (K11) |

What the research says, in one line: the pain is not "fraud" or "disputes" in the abstract. It is a small or first payment ("100 usd", "50 pounds"), the account limited, proof sent after the fact (V3, V10, V11), and a wait counted in months ("6 months", "180 days"). V12 is a warning for us: sellers have already met an AI that answers with generic copy. Our page must not read like that.

## Ledger

| Line on the page | Why it is there (which pain) | Source | Status |
| --- | --- | --- | --- |
| **Header** nav: "What it does", "For judges", "GitHub" | Way-finding; judges need the path and the code | - | our promise |
| **Hero** H1 "Get paid, and stay paid." | Kept. V1, V5, V11 all describe being paid and then losing access, so "stay paid" is exactly the gap. No research gave a stronger line. | PRODUCT.md tagline | our promise |
| "PayPal can hold a new seller's first payments for up to 21 days. If it closes your account, it keeps the balance for 180." | Leads with the two numbers sellers repeat (V5, V9) and PayPal publishes, so the reader recognises their situation before we talk about us | P1 (K1), P3 (K11) | verified fact |
| "Cleared checks each sale against the reasons PayPal gives for holds before you send the invoice, keeps your proof while you deliver, and drafts your reply if PayPal or your client asks questions. You approve every word." | The three moments in order; "proof" because V3/V10/V11 sellers gather it too late; "you approve" because Cleared drafts and PayPal decides (FLOWS §6) | PRODUCT.md F1, F4, F6 | our promise |
| Buttons "Try the live demo" / "Start as a new seller" | Says what happens; no sign-up step hidden | session actions | our promise |
| "Runs on the PayPal sandbox: no sign-up, no real money. Cleared is not affiliated with PayPal." | Honesty: sandbox and non-affiliation stated up front, not only in the footer | DESIGN.md brand rules | verified fact |
| Hero record: "Okafor Studio · Sale record", "Lagos Lo-Fi Records", "Album cover: “Harmattan Tapes”", "3000×3000 px, layered source, 2 revision rounds", "$250.00" | Show the product as paperwork instead of a diagram; replaces the invented "Northwind Studio, Brand illustrations, $400" card | seed.ts (cover sale, invoice item) | illustrative |
| "On hold. Releases in 6 days." / "Marked completed in PayPal yesterday. For services, PayPal releases the payment 7 days after that." | Sellers' word "on hold"; turns a hold into a date, the thing V5/V9 lack | seed.ts (`completedMarkedAt` −1 day, `expectedReleaseAt` +6), K5 (help129) | illustrative (fact behind it: verified K5) |
| "Proof kept on this sale": harmattan-sketch-v1.png 812 KB, harmattan-cover-final.png 6.4 MB, harmattan-cover-layers.pdf 9.1 MB, "Tolu A. confirmed receipt" (Safari, iPhone) | Proof exists before anyone asks (V3) | seed.ts evidence rows | illustrative |
| Caption "From the demo workspace: Ada Okafor, a freelance illustrator, and the album cover she delivered two days ago." | Says plainly that this is demo data | seed.ts (`deliveredAt` −2 days) | illustrative |
| **Sellers' words** H2 "The client paid. The money still isn't yours." | Restates V1/V11 in plain words; no quote marks because it is our sentence | V1, V11 (paraphrase) | our framing |
| "Freelancers and artists describe the same thing on r/paypal: a first big payment arrives, the account is limited, and they send PayPal their proof after the fact." | Names who and the pattern; "limited" is the sellers' word | V1, V3, V7, V8 (paraphrase); research ch.05/12: about one third of top-100 r/paypal posts are holds/limitations | our summary of sourced posts |
| "3,010 complaints were sent to the US Consumer Financial Protection Bureau about PayPal under “Trouble accessing funds in your mobile or digital wallet”, from January 2025 to September 2026." + link "CFPB complaint database, filtered" | One public, official number; closed date window so the link reproduces it | CFPB database, company "Paypal Holdings, Inc", issue as quoted, 1 Jan 2025 to 30 Sep 2026: **3,010 matches**, checked 20 Oct 2026 in a browser (same filter to 19 Oct: 3,045) | verified fact |
| Quote "paypal immediately limited my account once their payment of 100 usd went through" / "An artist, after the first commission invoice on a new business account" / "r/paypal, Aug 2026" | Ada's exact situation: first invoice, small amount | V1 | seller's own words |
| Quote "I submitted everything they requested, including my ID, screenshots ... legitimate freelance commissions." / "A freelance digital artist, before the account was closed" | Proof sent too late, and it wasn't enough; sets up "keep the proof as you work" | V3, V4 | seller's own words |
| Quote "PayPal says I can access my money only in 6 months (180 days), which is so far away it sounds like never." / "A 3D artist paid through Patreon, with $1,293 in the account" | The 180-day number in a seller's voice | V5 | seller's own words |
| “We hold the initial payments you receive for up to 21 days.” / "PayPal Help Center, on new sellers" | PayPal's own wording next to the sellers' | P1 (capitalised "We" at sentence start) | verified fact |
| “This decision can't be overturned.” The balance is “held for 180 days”. / "PayPal Help Center, on closed accounts" | Why prevention matters more than appeal (K11) | P3 | verified fact |
| **What it does** H2 "What Cleared does with Ada's next sale." | Plain sentence; replaces kicker + "Three moments ... handled." | - | our framing |
| "Before you send the invoice" / "Northwind Games offers Ada $400. That is more than 3× her usual sale, and Cleared says so first." | Concrete trigger instead of "check before you sell". $400 vs seeded average $109 (4 paid sales: 80, 60, 45, 250) = 3.7×; app shows "3× your average" | new-sale-flow.tsx SAMPLE; seed.ts; preflight.ts `spike` | illustrative |
| "A sudden spike in sales is one of the reasons PayPal gives for limiting an account. Long delivery times are a factor it weighs when it holds money back." | Explains why, from PayPal's published lists | K8 (help534 "sudden sales spike"), K13 (reserves: "extended delivery timeframes") | verified fact (from KNOWLEDGE.md, not re-fetched today) |
| "Cleared reads the sale the way you describe it, compares it with your own history, and explains each finding in a sentence. Every finding comes with a fix you can accept or skip." | Answers V13's "small things ... trigger automated flags" without promising to beat the flags | preflight.ts | our promise |
| Readiness demo: "This sale is 3× your average" → "Split into 50% deposit + 50% on delivery"; "No delivery date" → "Deliver within 10 days of payment"; "The description is vague" → "Files, size and revisions spelled out"; "No refund or revision terms" → "Standard terms added"; ring 38 → 94 | The real findings and fixes; score computed from preflight.ts weights (100−22−14−16−10 = 38; with fixes 100−6 = 94) | preflight.ts | illustrative (matches app logic) |
| "While you deliver" / "The proof is kept as you work, not gathered after the money is frozen." | "frozen" is the sellers' word (V5 title, V10); answers V3 | V3, V10 | our promise |
| "Each file you deliver, the client's timestamped “I received the work”, and the terms you agreed are stored on the sale they belong to." | What the locker holds | PRODUCT.md F4; seed acceptance row | our promise |
| "For a service, Cleared reminds you to mark the order completed in PayPal. PayPal says it releases the payment 7 days after that." | The one action that shortens a hold for services | K5 (help129), P2 | verified fact + our promise |
| Locker: harmattan-cover-final.png 6.4 MB, harmattan-cover-layers.pdf 9.1 MB, "Tolu A. confirmed receipt" 18:00, "PayPal invoice, paid" $250 | Real seeded proof; replaces invented "Invoice #0007" and "email thread Oct 13" | seed.ts | illustrative |
| "If the client disputes" / "You start from a drafted reply that cites your proof, not from a blank form." | The dispute moment; "drafted" per FLOWS §6 | PRODUCT.md F6 | our promise |
| "PayPal gives you 10 days to respond to a dispute. Cleared drafts the reply from what is on the sale, and every sentence points to an exhibit. A checker removes any claim the proof does not support." | Deadline is real; the claim checker is the honest AI story | K15; AI.md claim checker | verified fact + our promise |
| "You edit it and approve it. Nothing is sent to PayPal or your client before you do, and PayPal makes the decision." | Never promise outcomes | FLOWS §6 | our promise |
| Packet: "Reply to a “not received” dispute · $250", "The final files were delivered and the client confirmed receipt (A, B), as agreed in the invoice (C).", exhibits A/B/C, "Drafted by Cleared AI · Ada checks it and approves it before it is sent" | The demo's simulated dispute is MERCHANDISE_OR_SERVICE_NOT_RECEIVED on the accepted Harmattan sale; fake case id "PP-D-4417" removed | server/actions/demo.ts; FLOWS §6 AI label | illustrative |
| "What Cleared can't do: lift a limitation, release a hold early, or change a PayPal decision. It helps you give PayPal fewer reasons to hold your money, and better proof when it asks." | Honest limit; P3 says decisions can't be overturned, and sellers are wary of anyone claiming otherwise (V12, the scam DMs in the corpus) | P3, K11, PRODUCT.md | our promise |
| **For judges** H2 "For judges: try it as Ada, in about three minutes." | Judges' path; the label is in the heading, not a kicker | DEMO.md | our promise |
| "Cleared is built on PayPal's Invoicing, Orders, Tracking, Disputes and Webhooks APIs, in the sandbox, with test money only. The AI (OpenAI gpt-5-mini) only drafts. Anything that would reach PayPal waits for the seller's approval." | Sponsor/API clarity | STACK.md, AI.md | our promise (check each API is live before submission) |
| Steps 0:00 "Try the live demo" ... 2:30 "Review and approve" (Ada Okafor of Okafor Studio; $400 character-sheet sample; readiness 38 to 94; "In Sandbox controls, simulate a “not received” dispute on the Harmattan Tapes cover she has already delivered"; "Read the drafted reply and its exhibits, change any line, then approve it.") | Matches what the app does today. Removed "A verified PayPal webhook opens a case" and "follow PayPal's sandbox response": demo.ts currently creates a labelled simulated dispute (`verified: false`) | demo.ts, demo-panel.tsx, new-sale-flow.tsx | our promise |
| "Read the code and the README on GitHub" | Judges check the repo | site-chrome GITHUB_URL | - |
| Footer "Works with PayPal (sandbox). Not affiliated with or endorsed by PayPal." | Required honesty | DESIGN.md | verified fact |

## Voice

**Use the sellers' words:** on hold, limited, frozen, held for 180 days, 21 days, 6 months, the client paid, first commission, proof, invoice, dispute, "I received the work", release.

**Say exactly:** numbers with units ("21 days", "$400", "3×", "10 days to respond"), the real names from the demo, who decides ("PayPal makes the decision").

**Avoid:** seamless, empower, AI-powered, unlock, supercharge, effortless, peace of mind, handled, "in minutes" (unless measured), "guarantee", "protect your money", "never get frozen again", "get your money back". Never promise an outcome: Cleared checks, keeps, drafts, prepares; you approve; PayPal decides (FLOWS §6).

**Don't:** put quote marks around anything without an exact source; imitate a PayPal notice or use PayPal blue/gold; say "verified webhook" for a step that is simulated; call demo data "real".

**Visual rules that go with the copy:** no pill badge above the headline, no small uppercase kicker labels, no graph-paper backgrounds, no glowing dots, no "01 02 03" step rows. Headings are plain sentences. The illustrations are the product's own paperwork with the seeded data.

## Not verified, or changed

- **"3,040" removed.** The old figure (PRODUCT.md, ch.12) could not be reproduced: the old link used company "PAYPAL HOLDINGS, INC.", which now returns **0 matches** in the CFPB search. The working company value is "Paypal Holdings, Inc". With that, the same issue gives 3,045 to 19 Oct 2026 and 3,010 to 30 Sep 2026. The page uses 3,010 with a closed window. CFPB may still publish a few late complaints in that window, so the count can creep up. The CFPB API (curl) returns 403; the count was read from the search page in a headless browser.
- **Reddit quotes** were taken from the RSS capture of 19 Oct 2026; Reddit blocked a direct re-fetch on 20 Oct. Posts can be edited or deleted.
- **K8 / K13 wording** comes from KNOWLEDGE.md (help534, HELP393) and was not re-fetched today. HELP848 and pcc191 were re-fetched and match.
- **"one third of top r/paypal posts"** (DEMO.md video script) is not on the page.
- **DEMO.md says readiness 41 → 92.** The app's preflight.ts gives 38 → 94 for the sample against the fresh seed. The page uses 38 → 94. Update the video script, or the weights.
