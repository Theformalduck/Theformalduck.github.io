import { auth } from "@/auth";
import { getAIUsage } from "@/lib/aiUsage";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const usage = await getAIUsage(session.user.id);
  return NextResponse.json(usage);
}
