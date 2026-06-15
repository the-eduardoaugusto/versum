import { env } from "@/utils/env"
import { v2, type UploadApiOptions } from "cloudinary"

class CloudinaryClient {

  constructor(
    private cloudinary: typeof v2,
    private cloudName: string,
    private apiKey: string,
    private apiSecret: string,
  ) {
    this.config()
  }

  private config() {
    this.cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    })
  }

  uploadBuffer(buffer: Buffer, options: UploadApiOptions): Promise<string> {
    const folder = "versum/" + (options.folder ?? "")
    return new Promise((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        { ...options, folder },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"))
          const url: string = result.eager?.[0]?.secure_url ?? result.secure_url
          resolve(url)
        },
      )
      stream.end(buffer)
    })
  }

}

export const cloudinaryClient = new CloudinaryClient(v2, env.CLOUDINARY_CLOUD_NAME, env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET)
