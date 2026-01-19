import { env } from "@/env";
import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "node:path";

const certPath = path.join(process.cwd(), env.DATABASE_CERT_PATH);
const cert = fs.readFileSync(certPath, "utf-8");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: cert,
    cert: cert,
    key: cert,
    rejectUnauthorized: false,
  },
});

export const prisma = new PrismaClient({
  adapter,
});

export * from "../../../generated/prisma/client";
