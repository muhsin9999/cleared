// Shared OpenAI client and model choice for Cleared's AI jobs (docs/AI.md).
import "server-only";
import "@/lib/net";
import OpenAI from "openai";

let client: OpenAI | undefined;
export const openai = () => (client ??= new OpenAI({ timeout: 25_000, maxRetries: 1 }));
export const modelFor = (job: "preflight" | "notice" | "packet") =>
  process.env[`AI_MODEL_${job.toUpperCase()}`] || process.env.AI_MODEL || "gpt-5.4-mini";
