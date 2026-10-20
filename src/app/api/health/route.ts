// Render health check. Deliberately does not touch the database, so Neon's free compute can
// scale to zero between visits (Render pings this every few seconds).
export async function GET() {
  return Response.json({ ok: true });
}
