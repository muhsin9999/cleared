# cleared

**Get paid, and stay paid.** Cleared protects new sellers, freelancers and artists from sudden PayPal holds, limitations and disputes. It checks a sale before it happens, sends a clear PayPal invoice, keeps the proof as the work is delivered, and drafts a cited evidence packet the moment PayPal asks questions. **The seller approves every step before anything is sent.**

> Built for the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/) (deadline 12 Nov 2026). Status: **skeleton built** (day 2): every page, the database and the demo path work; PayPal and AI calls are wired in on days 3–9.
>
> Cleared is not affiliated with or endorsed by PayPal. It uses the public PayPal sandbox APIs.

## Planning documents

| Doc | What it decides |
| --- | --- |
| [docs/PRODUCT.md](docs/PRODUCT.md) | User, problem, promise, scope, every screen and flow, error cases, and what is real versus simulated in the sandbox |
| [docs/FLOWS.md](docs/FLOWS.md) | **Who signs in and how, every page and route, page states, the journeys (including the judge's 3-minute path)** |
| [docs/STACK.md](docs/STACK.md) | Every technology choice with its reason, the architecture, deployment and cost |
| [docs/PAYPAL.md](docs/PAYPAL.md) | Exact PayPal APIs, webhooks, sandbox setup and known traps |
| [docs/AI.md](docs/AI.md) | Model, prompts, structured outputs, tools, guardrails and human approval |
| [docs/SPONSORS.md](docs/SPONSORS.md) | Every sponsor assessed: in or out, and how each chosen one is shown |
| [docs/COMPETITORS.md](docs/COMPETITORS.md) | Nearest hackathon entries and market products, plus the one-line differentiator |
| [docs/DESIGN.md](docs/DESIGN.md) | UI libraries, design system, brand, the three wow moments, accessibility |
| [docs/DEMO.md](docs/DEMO.md) | The under-3-minute video script and the submission checklist |
| [docs/PLAN.md](docs/PLAN.md) | Day-by-day build plan to a submitted entry on 1 Nov |
| [docs/KNOWLEDGE.md](docs/KNOWLEDGE.md) | PayPal's published hold, limitation, reserve and dispute rules, which the AI cites |

## Definition of done

1. Deployed on Render and always on. A judge can enter as the demo seller with one click, no keys needed.
2. The full sandbox loop works end to end: invoice → payment → proof → dispute → evidence packet → approval → `provide-evidence` → resolution. Failure states are handled.
3. Public repo with an MIT licence, setup instructions and a `.env.example`.
4. A YouTube video under 3 minutes and the Devpost write-up.
5. Sponsor use (Render Workflows, APIMatic plugin, Postman collection) documented.
6. **Submitted on Devpost by 1 Nov 2026**, then improved until 12 Nov.
