import { token, tokenInfo, step } from "./paypal.mjs";
await token();
const { scope, app_id } = tokenInfo();
const want = ["invoicing", "disputes", "checkout", "tracking", "webhook"];
step("OAuth client_credentials", true, `app ${app_id}`);
for (const w of want) {
  const hits = scope.split(" ").filter((s) => s.toLowerCase().includes(w));
  step(`scope includes *${w}*`, hits.length > 0, hits.slice(0, 3).join(" ") || "missing");
}
