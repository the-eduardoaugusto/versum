import { v2 as cloudinary } from "cloudinary";
import { env } from "@/utils/env/index.ts";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export function avatarPublicId(userId: string): string {
  return `versum/avatars/${userId}`;
}
