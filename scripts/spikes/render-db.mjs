// Runs a tsx script against the live (Render) database: fetches DATABASE_URL from the Render env group in memory.
// Usage: node --env-file=.env.local scripts/spikes/render-db.mjs <script.ts>
import { spawnSync } from "node:child_process";
const h = { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, Accept: "application/json" };
const groups = await (await fetch("https://api.render.com/v1/env-groups?limit=50", { headers: h })).json();
const g = await (await fetch(`https://api.render.com/v1/env-groups/${groups.find(({ envGroup }) => envGroup.name === "cleared-secrets").envGroup.id}`, { headers: h })).json();
const url = g.envVars.find((x) => x.key === "DATABASE_URL").value;
const r = spawnSync("npx", ["tsx", "--conditions=react-server", process.argv[2]], { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
process.exit(r.status ?? 1);
