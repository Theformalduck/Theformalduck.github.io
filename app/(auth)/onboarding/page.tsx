import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import OnboardingClient from "./onboarding-client";

export const dynamic = "force-dynamic";

// Onboarding is for brand-new accounts only. A user who already has a username
// has finished setup, so logging in (incl. via a social button that points here)
// should never force them to "set up" again — send them to the dashboard.
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/onboarding");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  if (user?.username) redirect("/dashboard");

  return <OnboardingClient />;
}
