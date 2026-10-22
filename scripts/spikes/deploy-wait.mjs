// Waits for cleared-web's latest deploy to go live and prints its commit.
const h = { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, Accept: "application/json" };
const services = await (await fetch("https://api.render.com/v1/services?limit=50", { headers: h })).json();
const web = services.find(({ service }) => service.name === "cleared-web").service;
for (let i = 0; i < 80; i++) {
  const [{ deploy }] = await (await fetch(`https://api.render.com/v1/services/${web.id}/deploys?limit=1`, { headers: h })).json();
  if (["live", "build_failed", "update_failed", "canceled", "pre_deploy_failed"].includes(deploy.status)) { console.log(deploy.status, deploy.commit?.id?.slice(0, 7)); process.exit(0); }
  await new Promise((r) => setTimeout(r, 15000));
}
console.log("still deploying");
