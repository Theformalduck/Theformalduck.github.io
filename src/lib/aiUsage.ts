import { prisma } from "@/lib/prisma";

const FREE_LIMIT = 5;

export async function checkAndIncrementAIUsage(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, aiUsageCount: true, aiUsageResetAt: true },
  });

  if (!user) return { allowed: false, used: 0, limit: FREE_LIMIT };

  const isPro = user.plan === "pro" && (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing");
  if (isPro) return { allowed: true, used: user.aiUsageCount, limit: Infinity };

  // Reset monthly counter if needed
  const now = new Date();
  const needsReset = !user.aiUsageResetAt || user.aiUsageResetAt <= now;

  if (needsReset) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await prisma.user.update({
      where: { id: userId },
      data: { aiUsageCount: 1, aiUsageResetAt: nextReset },
    });
    return { allowed: true, used: 1, limit: FREE_LIMIT };
  }

  if (user.aiUsageCount >= FREE_LIMIT) {
    return { allowed: false, used: user.aiUsageCount, limit: FREE_LIMIT };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { aiUsageCount: { increment: 1 } },
  });

  return { allowed: true, used: user.aiUsageCount + 1, limit: FREE_LIMIT };
}

export async function getAIUsage(userId: string): Promise<{ used: number; limit: number; resetAt: Date | null; isPro: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, aiUsageCount: true, aiUsageResetAt: true },
  });

  if (!user) return { used: 0, limit: FREE_LIMIT, resetAt: null, isPro: false };

  const isPro = user.plan === "pro" && (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing");

  // Auto-reset expired counters for display
  const now = new Date();
  const expired = !user.aiUsageResetAt || user.aiUsageResetAt <= now;
  const used = expired ? 0 : user.aiUsageCount;

  return {
    used,
    limit: FREE_LIMIT,
    resetAt: user.aiUsageResetAt,
    isPro,
  };
}
