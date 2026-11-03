// Search the web service's recent logs: node --env-file=.env.local scripts/spikes/web-logs.mjs <regex> [hours]
const re = new RegExp(process.argv[2] ?? "error", "i");
const hours = Number(process.argv[3] ?? 48);
const h = { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, Accept: "application/json" };
const get = async (u) => (await fetch(`https://api.render.com/v1${u}`, { headers: h })).json();
const svc = (await get("/services?limit=50")).find(({ service }) => service.name === "cleared-web").service;
const hits = [];
for (let t = Date.now() - hours * 3600e3; t < Date.now(); t += 3600e3) {
  const q = new URLSearchParams({ ownerId: svc.ownerId, resource: svc.id, limit: "100", startTime: new Date(t).toISOString(), endTime: new Date(Math.min(t + 3600e3, Date.now())).toISOString()});
  hits.push(...((await get(`/logs?${q}`)).logs ?? []).filter((l) => re.test(l.message)));
}
for (const l of hits.sort((a, b) => a.timestamp.localeCompare(b.timestamp))) console.log(l.timestamp.slice(5, 19), l.message.slice(0, 400));
console.log(hits.length, "lines");
