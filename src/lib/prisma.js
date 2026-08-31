// lib/prisma.js — Singleton PrismaClient for Prisma 7 with LibSQL adapter
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis;

function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const dbPath = path.resolve(process.cwd(), "dev.db").replace(/\\/g, "/");
  const url = `file:${dbPath}`;

  // In Prisma 7, PrismaLibSql takes the config object { url } directly
  const adapter = new PrismaLibSql({ url });

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
