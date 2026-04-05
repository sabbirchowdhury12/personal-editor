import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

const createPrismaClient = () => {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof createPrismaClient>;
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
