// Polls PayPal for new or changed disputes (cron). Run with: npm run disputes:sync
import "../src/lib/net";
import { syncDisputes, syncPool } from "../src/server/paypal/disputes";
import { ensureDraft } from "../src/server/workflows";

const disputes = await syncDisputes();
for (const id of disputes.createdIds) await ensureDraft(id);
console.log("disputes:", { ...disputes, createdIds: disputes.createdIds.length });
console.log("judge-mode stock:", await syncPool());
process.exit(0);
