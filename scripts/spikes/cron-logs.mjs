// A Render cron job's recent runs and the log lines of failing ones: node --env-file=.env.local scripts/spikes/cron-logs.mjs cleared-dispute-sync
const name = process.argv[2] ?? "cleared-dispute-sync";
const h = { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, Accept: "application/json" };
const get = async (u) => (await fetch(`https://api.render.com/v1${u}`, { headers: h })).json();
const svc = (await get("/services?limit=50")).find(({ service }) => service.name === name).service;
const runs = await get(`/services/${svc.id}/jobs?limit=20`).catch(() => []);
const deploys = await get(`/services/${svc.id}/deploys?limit=3`);
console.log("deploys:", deploys.map(({ deploy }) => `${deploy.status} ${deploy.commit?.id?.slice(0, 7)} ${deploy.finishedAt ?? ""}`).join(" | "));
// Render returns the oldest lines first and caps each page, so read the window one hour at a time.
const hours = Number(process.argv[3] ?? 36);
const all = [];
for (let t = Date.now() - hours * 3600e3; t < Date.now(); t += 3600e3) {
  const q = new URLSearchParams({ ownerId: svc.ownerId, resource: svc.id, limit: "100", startTime: new Date(t).toISOString(), endTime: new Date(Math.min(t + 3600e3, Date.now())).toISOString() });
  all.push(...((await get(`/logs?${q}`)).logs ?? []));
}
const lines = all.sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map((l) => `${l.timestamp.slice(5, 19)} ${l.message}`);
console.log(`${lines.length} log lines (last ${hours} h). Errors and exits:`);
for (const l of lines.filter((l) => /error|fail|exit|throw|ECONN|ETIMEDOUT|ENOTFOUND|status 1|at /i.test(l)).slice(-40)) console.log(" ", l.slice(0, 260));
console.log("last 15 lines:"); for (const l of lines.slice(-15)) console.log(" ", l.slice(0, 200));
