# Sponsor plan

**Rule:** a project wins at most one grand prize **or** one honorable mention, **plus one sponsor prize**. It may be *eligible* for several sponsor prizes; that costs nothing, but each extra integration must make the product better ([rules](https://paypalaihackathon.devpost.com/rules)).

## Verdicts

| Sponsor | Requirement | Fit | Cleared integration | Hours | Verdict |
| --- | --- | --- | --- | --- | --- |
| **Render** (credits $1k/$750/$500) | Deploy on Render **and** use Render Workflows | 5 | Web service, Postgres and cron on Render. **Workflows run the real pipeline:** `onDisputeCreated → gatherProof → draftPacket → checkClaims → awaitApproval`, `submitEvidence`, `autoTrack`, nightly `holdWatcher`. Retries and timeouts are visible in the UI. | built-in | **IN: primary target** (judge: Shifra Williams) |
| **APIMatic** ($1k cash + 6 months Business, ×3) | Use the **PayPal Context Plugin** to build the PayPal integration | 4 | Install with `npx context-plugins install paypal` in Claude Code. Write the Orders, capture and tracking code (`@paypal/paypal-server-sdk`) with it. | 1–2 (proof) | **IN: cash insurance** |
| **Postman** (no prize) | Resources only | 3 | Public collection "Cleared × PayPal sandbox": OAuth → invoice → order → track → dispute simulate → provide-evidence → adjudicate, with an environment. Lets judges replay every PayPal call. | 2–3 | **IN: cheap; judge Pooja Mistry** |
| Elastic (no prize) | Multi-step agent with Elasticsearch + Jina embeddings | 3 | Hybrid search over the knowledge base and locker so packet claims quote exact policy clauses | 6–10 | OPTIONAL (N2) only after must-ship |
| KERNEL (no prize) | Browser infrastructure, $50 credit | 2 | Timestamped screenshot of the carrier's "Delivered" page into the locker | 4–6 | OPTIONAL stretch (carrier terms-of-service and bot-blocking risk) |
| Zapier (no prize) | Zapier MCP | 2 | SMS/Slack alert when a dispute opens | 1–2 | OUT (email is enough) |
| Astropods (no prize) | Agent runtime | 1 | Would duplicate Render Workflows and blur the Render story | — | OUT |
| AG Grid ($5k first) | AG Studio + Studio Agent Framework | 2 | Risk dashboard: extra surface, little extra protection | 10–15 | **OUT: saved for Lifeline** |
| Bryntum (3×$1k) | Gantt / Scheduler / Calendar | 3 | Deadline calendar | 6–8 | **OUT: saved for Spoilclock** |
| Channel3 ($1.5k, 1 winner) | Must call the Channel3 API/MCP meaningfully | 2 | Market-price check in pre-flight | 4 | OUT (side feature, one winner) |

## How each IN sponsor is shown

**Render**
- README "Architecture on Render" section and `render.yaml` in the repo.
- About 15 seconds of the video shows the Workflow run view: tasks chaining, a retry after a simulated PayPal timeout, then the packet ready.
- Devpost text names each workflow task and why it needs durability.
- Claim the $50 credit at the [credits portal](https://credits-portal-mmdm.onrender.com/claim/paypal-ai-hackathon). **Confirm it lasts until 15 Dec.**

**APIMatic**
- Fill the [claim form](https://docs.google.com/forms/d/e/1FAIpQLScc2oCgAFACm7d6H3R4mgzv-O34DdyVnLIBNiwmUNggr_-hhA/viewform).
- Add the README section "Built with APIMatic Context Plugin for PayPal" with setup steps and two or three Claude Code screenshots showing the plugin supplying Orders/tracking context.
- Mention the plugin in commit messages.
- Five seconds in the video plus one line on what it caught, such as the correct `/track` body fields.

**Postman**
- Put a "Run in Postman" button in the README.
- Link the collection in the Devpost "Try it out" links.

## Honorable-mention lane

Aim for **Most Impactful** first. **Best Use of PayPal + AI** is the alternative. Cleared does not compete for Agentic Commerce, which is Spoilclock's lane.

## Trial timing

Cleared uses no time-limited trials. AG Grid's and Bryntum's 45-day trials (for the other projects) should start **on or after 1 Nov**, so they cover judging until 15 Dec.
