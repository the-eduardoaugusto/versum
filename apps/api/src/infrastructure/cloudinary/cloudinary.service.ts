import { InternalServerError } from "@/utils/app/errors/index.ts";
import { avatarPublicId, cloudinary } from "./index.ts";

export class CloudinaryService {
  uploadAvatar({
    userId,
    bytes,
  }: {
    userId: string;
    bytes: Buffer;
  }): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: avatarPublicId(userId),
          overwrite: true,
          invalidate: true,
          resource_type: "image",
          transformation: [
            {
              width: 512,
              height: 512,
              crop: "fill",
              gravity: "auto",
              quality: "auto",
            },
          ],
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(new InternalServerError("Avatar upload failed"));
            return;
          }
          resolve(result.secure_url);
        },
      );
      stream.end(bytes);
    });
  }

  async destroyAvatar({ userId }: { userId: string }): Promise<void> {
    await cloudinary.uploader.destroy(avatarPublicId(userId), {
      invalidate: true,
    });
  }
}
