import sharp from "sharp";

const raw = Buffer.alloc(16 * 16 * 3);
const buf = await sharp(raw, { raw: { width: 16, height: 16, channels: 3 } })
  .webp()
  .toBuffer();

console.log(`sharp OK (v${sharp.versions.sharp}), produced ${buf.length}-byte webp`);
