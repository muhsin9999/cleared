// Polls PayPal for new or changed disputes (cron). Run with: npm run disputes:sync
import "../src/lib/net";
import { syncDisputes } from "../src/server/paypal/disputes";

console.log("disputes:", await syncDisputes());
process.exit(0);
