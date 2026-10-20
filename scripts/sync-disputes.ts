// Polls PayPal for new or changed disputes (cron). Run with: npm run disputes:sync
import "../src/lib/net";
import { syncDisputes, syncPool } from "../src/server/paypal/disputes";

console.log("disputes:", await syncDisputes());
console.log("judge-mode stock:", await syncPool());
process.exit(0);
