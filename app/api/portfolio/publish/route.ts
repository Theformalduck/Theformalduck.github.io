import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { published } = body;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    });

    const portfolio = await db.portfolio.update({
      where: { userId: session.user.id },
      data: { published: published ?? true },
    });

    if (user?.username) {
      revalidatePath(`/${user.username}`);
    }

    return NextResponse.json(portfolio);
  } catch (err) {
    console.error("[portfolio/publish POST]", err);
    return NextResponse.json({ error: "Failed to update publish state" }, { status: 500 });
  }
}
