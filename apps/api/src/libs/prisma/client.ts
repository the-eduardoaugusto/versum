import { env } from "@/env";
import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "node:path";

const isTest = env.NODE_ENV === "test";

let cert = "";

if (!isTest) {
  const certPath = path.join(process.cwd(), env.DATABASE_CERT_PATH);
  cert = fs.readFileSync(certPath, "utf-8");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...(isTest
    ? {}
    : {
        ssl: {
          ca: cert,
          cert: cert,
          key: cert,
          rejectUnauthorized: false,
        },
      }),
});

export const prisma = new PrismaClient({
  adapter,
});
