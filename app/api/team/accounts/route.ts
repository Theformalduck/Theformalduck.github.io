import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { listAccounts, ACCOUNT_COOKIE } from "@/lib/team";

// Accounts the signed-in user can operate (their own + active staff memberships),
// plus which one is currently active.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await listAccounts(session.user.id);
  const active = (await cookies()).get(ACCOUNT_COOKIE)?.value ?? session.user.id;
  const activeId = accounts.some((a) => a.ownerId === active) ? active : session.user.id;

  return NextResponse.json({ accounts, activeId });
}
