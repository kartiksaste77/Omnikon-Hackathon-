// lib/prisma.js — Singleton PrismaClient for Prisma 7 with LibSQL adapter
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import path from "path";

const globalForPrisma = globalThis;

function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const dbPath = path.resolve(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");
  const libsql = createClient({
    url: `file:${dbPath}`,
  });
  const adapter = new PrismaLibSql(libsql);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

const prisma = getPrisma();
export default prisma;
