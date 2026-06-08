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

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const db = getDb();
