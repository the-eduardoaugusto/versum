import { createHmac } from "node:crypto";
import { env } from "../env/index.ts";

const SECRET = Buffer.from(env.METADATA_HASH_SECRET, "hex");

export function hashMetadata(input: string): string {
  return createHmac("sha256", SECRET).update(input).digest("hex");
}
