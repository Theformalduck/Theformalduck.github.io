import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDb() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set. Add it to .env.local");
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    // Serverless tuning: keep each instance's pool small so many concurrent
    // Vercel functions don't exhaust the Supabase pooler's connection limit,
    // and fail fast (rather than hang) when the pooler is momentarily saturated.
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  const client = new PrismaClient({ adapter });

  // Reuse a single client across warm invocations in every environment.
  globalForPrisma.prisma = client;

  return client;
}

export const db = getDb();
