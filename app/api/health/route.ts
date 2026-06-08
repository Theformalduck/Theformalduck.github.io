import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Liveness/readiness probe for uptime monitors and load balancers.
// Returns 200 when the DB is reachable, 503 otherwise.
export async function GET() {
  const started = Date.now();
  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return NextResponse.json(
    {
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "up" : "down",
      uptimeSec: Math.round(process.uptime()),
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
