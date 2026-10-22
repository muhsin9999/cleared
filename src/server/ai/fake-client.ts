// Local design work only (AI_FAKE=true, never on Render): stands in for the OpenAI client so the case room's
// live view can be built and screenshotted without paying for model calls. It walks the same tools a real run
// uses, with pauses, and drafts plain claims straight from the exhibits. The packet is marked "fake-local".
import type OpenAI from "openai";
import type { Finding } from "@/lib/preflight";
import type { CaseFile } from "./investigate";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const day = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

export const fakeAiEnabled = () => process.env.AI_FAKE === "true" && !process.env.RENDER;

/** Stands in for the AI pre-flight pass: a pause, then one finding the rules can't raise. */
export async function fakePreflight(): Promise<Finding[]> {
  await wait(2600);
  return [{ id: "ai-0", severity: "caution", title: "Usage rights aren’t stated", reason: "Say whether the client may use the work commercially. A client who expected full rights can call it “not as described”.", ruleRef: "K16", weight: 6, source: "ai" }];
}

export function fakeClient(c: CaseFile): OpenAI {
  let turn = 0;
  const call = (name: string, args: object = {}) => ({ type: "function_call", name, call_id: `${name}-${Math.random()}`, arguments: JSON.stringify(args) });
  const parse = async () => {
    const t = turn++ - 1;
    await wait(t <= 0 ? 2200 : 1800);
    const usage = { input_tokens: 0, output_tokens: 0, input_tokens_details: { cached_tokens: 0 } };
    if (t === -1) return { id: "fake-plan", usage, output: [call("write_plan", { steps: ["Read the buyer’s claim that the files never arrived", "Open every delivered file and the client’s confirmation", "Match the delivery dates to the paid invoice", "Find PayPal’s rule for digital goods"] })] };
    if (t === 0) return { id: "fake-0", usage, output: [call("get_dispute"), call("get_sale"), call("get_invoice"), call("list_locker_items")] };
    if (t === 1)
      return {
        id: "fake-1",
        usage,
        output: [...c.exhibits.filter((e) => e.kind !== "invoice").map((e) => call("read_locker_item", { letter: e.letter })), call("search_policy", { query: "item not received, digital goods" })],
      };
    const claims = c.exhibits.map((e) => ({ text: `${e.label} is dated ${day(e.date)}.`, exhibits: [e.letter] }));
    return {
      id: "fake-2",
      usage,
      output: [{ type: "message", content: [] }],
      output_parsed: {
        recommendation: "fight",
        rationale: "Local stand-in for the AI: these claims are copied straight from the exhibits.",
        claims,
        missing_evidence: [],
        cover_letter: "Local stand-in.",
        rules_cited: [],
        ignored_instructions: [],
      },
    };
  };
  return { responses: { parse } } as unknown as OpenAI;
}
