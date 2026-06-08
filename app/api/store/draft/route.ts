import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildStoreData } from "../settings/route";

// Save the current editor state as the DRAFT (does not affect the live store).
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    await db.store.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, draftSettings: body },
      update: { draftSettings: body },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[store/draft PUT]", err);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}

// Publish the draft — copy it into the live columns and clear the draft.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const store = await db.store.findUnique({
      where: { userId: session.user.id },
      select: { draftSettings: true },
    });
    if (!store?.draftSettings) {
      return NextResponse.json({ error: "No draft to publish" }, { status: 400 });
    }
    const data = buildStoreData(store.draftSettings as any);
    await db.store.update({
      where: { userId: session.user.id },
      data: { ...data, draftSettings: Prisma.DbNull },
    });

    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { username: true } });
    if (user?.username) {
      revalidatePath(`/${user.username}/store`);
      revalidatePath(`/${user.username}/store/products`);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[store/draft POST]", err);
    return NextResponse.json({ error: "Failed to publish" }, { status: 500 });
  }
}

// Discard the draft — revert the editor to the live (published) settings.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await db.store.update({
      where: { userId: session.user.id },
      data: { draftSettings: Prisma.DbNull },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[store/draft DELETE]", err);
    return NextResponse.json({ error: "Failed to discard draft" }, { status: 500 });
  }
}
