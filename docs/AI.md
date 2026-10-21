# AI design

**Principle:** the AI reads, reasons, drafts and explains. **Code validates. The seller approves. Only an approved record can move money or submit evidence.** This is PayPal's own stated principle for agents: act within permissions, with human approval, and without touching credentials.

## Model and SDK

- **SDK:** the official `openai` npm package (TypeScript, Responses API). The dispute investigator (J4) runs **only in the Render Workflow task `draftPacket`**. The interactive jobs, pre-flight (J1, `src/server/ai/preflight.ts`) and the notice reader (J3, `src/server/ai/notice.ts`), run directly in the request because they take 3–8 s and the seller is waiting; each has a 25 s timeout and a rule-based fallback, and every call is written to the audit log (Settings → AI audit log).
- **Model routing (J4):** disputes of $500 or more use `gpt-5.4`, the rest `gpt-5.4-mini` (`AI_ROUTE_LARGE_CENTS`, `AI_MODEL_PACKET_LARGE`). Decided by the evals: same recommendations, but the larger model writes more supported claims and none unsupported when tools fail.
- **Model:** **`gpt-5.4-mini`**, read from the `AI_MODEL` env var. Chosen 21 Oct: `gpt-5-mini` and `gpt-5` require OpenAI organization verification on this account, while `gpt-5.4-mini` (newer) works without it and made correct strict tool calls in under a second. Listed at about $0.75 / $4.50 per million tokens (third-party listings; re-check OpenAI's pricing page). Cheaper `gpt-5.6-luna` / `gpt-6-luna` also work and will be compared on the evals. 400k context, image and PDF input, function tools.
  - Reasoning depth is set per job with `reasoning: { effort }`: `low` for pre-flight and invoice writing, `medium` for notice parsing and evidence packets.
  - **Upgrade path:** each job reads its own model from env (`AI_MODEL_PACKET`, falling back to `AI_MODEL`). If the packet eval shows weak citations, only J4 moves to a stronger GPT model.
  - **Escape hatch:** because the code uses the OpenAI SDK, OpenRouter is a drop-in by changing `baseURL` and the key.
- **Structured outputs:** Zod schemas through `zodTextFormat` (`openai/helpers/zod`) and `client.responses.parse`, in strict JSON-schema mode, so the output always matches the schema.
- **Refusal and failure handling:** check for a `refusal` content item and a null `output_parsed` before reading the result. Retry twice with backoff, then try `AI_FALLBACK_MODEL` if set. If it still fails, show "Draft needs your input" and build the template packet.
- **Prompt caching:** OpenAI caches repeated prompt prefixes of 1,024 tokens or more automatically. The system prompt and PayPal knowledge base ([KNOWLEDGE.md](KNOWLEDGE.md), roughly 10–20k tokens) always come first and never change between calls; volatile data (the sale, dispute and locker) goes after them. Check `usage.input_tokens_details.cached_tokens`.
- **Cost per evidence packet:** about 30k input tokens (mostly cached) plus 4k output, roughly $0.01. Set a monthly spend limit in the OpenAI dashboard. Cache the demo outputs per case so repeated judge clicks are free.

## AI jobs

| Job | Input | Output (Zod schema → `zodTextFormat`, parsed with `responses.parse`) | Effort |
| --- | --- | --- | --- |
| **J1 Pre-flight check** (F1) | Sale description, amount, delivery plan, seller history summary (deterministic stats), knowledge base | `{score 0–100, findings[{id, severity, rule_ref, plain_reason, fix:{field, suggested_value}}], summary}` | low |
| **J2 Invoice writer** (F2) | Job description plus accepted fixes | `{items[{name, description, quantity, unit_amount}], note, terms, delivery_date}` mapped to the Invoicing v2 schema | low |
| **J3 Notice reader** (F7) | Pasted text or an uploaded PDF/screenshot (`input_file` or `input_image`), plus whether it appears in the Resolution Center (seller answers) | `{phishing_verdict{likely_phishing, signals[]}, notice_type, requests[{what_paypal_asked, deadline?, matched_exhibits[], missing[]}], draft_reply}` | medium |
| **J4 Evidence packet** (F6) | Dispute JSON, invoice, acceptance record, file metadata plus extracted text, tracking, messages, knowledge base | `{recommendation: fight\|offer\|accept, rationale, claims[{text, exhibit_ids[], evidence_type}], cover_letter, exhibit_order[]}` | medium |

**Why a structured workflow and not a free-roaming agent:** every step of Cleared is known in advance and the cost of an error is high, because it involves money and PayPal's view of the seller. Code orchestrates the steps inside a Render Workflow; the model is used where judgement is needed. That is more reliable and easier to demo than an open loop.

**The one agentic part, J4:** the dispute investigator (`src/server/ai/investigator.ts`, Render Workflow task `draftPacket`). It runs as a short tool loop (at most 8 turns, several tools per turn) with strict function tools, all **read-only**, at reasoning effort `low` (21 Oct test: same quality as `medium` in less time). Tool errors come back as structured `{error, message, retryable}` objects, and the agent is told to work with what it has and list what it couldn't check. Its steps are stored and shown live in the case room; if it fails, the template packet is used and labelled. Verified: it ignores instructions planted in the buyer's message, and the claim checker strikes claims whose dates, amounts or file names its exhibits don't support:
- `get_dispute`
- `get_invoice`
- `list_locker_items`
- `read_locker_item`
- `get_tracking`
- `search_policy`

It decides what to look at. It has **no write tools**. Submission is a separate task that only runs when an approval exists.

## Guardrails

1. **Claim checker (deterministic):** every claim must cite at least one existing exhibit ID, and the facts named in a claim (dates, amounts, filenames) must match the exhibit's metadata. Claims that fail are removed and listed to the seller as "couldn't verify."
2. **No invented facts:** the prompt rule is "if the locker doesn't show it, say it's missing". J4 can return `missing_evidence[]`, which becomes a to-do list for the seller.
3. **Honest recommendation:** if the evidence is weak, J4 must recommend `offer` or `accept`. This matches PayPal's interest in fair outcomes, and judges reward honesty.
4. **Prompt-injection safety:** buyer messages and uploaded documents are data, never instructions. Tools are read-only anyway. The agent reports what it refused (`ignored_instructions`); `src/lib/injection.ts` keeps a flag only if the quote really appears in the case and is aimed at the AI, and the case room shows it ("Ignored an instruction hidden in the case").
5. **Phishing first:** J3 checks for phishing before drafting anything. If phishing is likely, there is no draft, only "forward to phishing@paypal.com".
6. **Audit log:** every AI call stores model, reasoning effort, input hash, output, the checker's result and the approver. The audit is visible to judges in the case room ("why did Cleared say this?").

## Evaluation

The investigator has a scored eval suite: 13 scenarios (strong and weak cases, goods and services, three prompt
injections, a tool failure), run 3 times each against the real model. Latest: 38/39 runs pass every check,
recommendation right 39/39, injections resisted 9/9, about $0.006 and 7.5 s per case. Scenarios, commands and the
model comparison behind the routing rule are in [../evals/README.md](../evals/README.md). Re-run `npm run eval --
--repeat 3` after any change to the prompt, tools or model; the audit log stores the prompt version
(`PROMPT_VERSION`) so every packet can be traced to the prompt that wrote it.
