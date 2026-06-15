import type { Context } from "hono";
import type { Session } from "@/modules/auth/repositories/auth.types.repository";
import { BadRequestError, InternalServerError, NotFoundError } from "@/utils/app/errors/index";
import { SuccessViewModel } from "@/view-models/default/success.view-model";
import { ProfileServiceV1 } from "../services/profile.v1.service";
import { cloudinaryClient } from "@/infrastructure/cloudinary/client";

export class ProfileControllerV1 {
  private readonly service: ProfileServiceV1;

  constructor({ service }: { service?: ProfileServiceV1 } = {}) {
    this.service = service ?? new ProfileServiceV1();
  }

  createProfile = async (c: Context) => {
    const session = c.get("session") as Session;
    const body = await c.req.json();

    const profile = await this.service.createProfile({
      ...body,
      userId: session.userId,
    });

    return c.json(
      SuccessViewModel.create({ data: profile, message: "Profile created", code: "PROFILE_CREATED" }),
      201,
    );
  };

  getAuthenticatedProfile = async (c: Context) => {
    const session = c.get("session") as Session;

    const profile = await this.service.getProfileByUserId({
      userId: session.userId,
    });

    if (!profile) {
      throw new NotFoundError("Profile not found");
    }

    return c.json(
      SuccessViewModel.create({ data: profile, message: "Profile retrieved", code: "PROFILE_RETRIEVED" }),
      200,
    );
  };

  updateAuthenticatedProfile = async (c: Context) => {
    const session = c.get("session") as Session;
    const body = await c.req.json();

    const profile = await this.service.updateProfile({
      ...body,
      userId: session.userId,
    });

    return c.json(
      SuccessViewModel.create({ data: profile, message: "Profile updated", code: "PROFILE_UPDATED" }),
      200,
    );
  };

  getProfileByUsername = async (c: Context) => {
    const rawUsername = c.req.param("username");
    if (!rawUsername) {
      throw new BadRequestError("Username is required");
    }
    const username = rawUsername.startsWith("@")
      ? rawUsername.slice(1)
      : rawUsername;

    const profile = await this.service.getProfileByUsername({ username });

    if (!profile) {
      throw new NotFoundError("Profile not found");
    }

    return c.json(
      SuccessViewModel.create({ data: profile, message: "Profile retrieved", code: "PROFILE_RETRIEVED" }),
      200,
    );
  };

  updateProfilePicture = async (c: Context) => {
    const session = c.get("session") as Session;
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!(file instanceof File)) {
      throw new BadRequestError("File is required");
    }

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      throw new BadRequestError("Invalid file type. Only JPEG and PNG are accepted");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let pictureUrl: string;
    try {
      pictureUrl = await cloudinaryClient.uploadBuffer(buffer, {
        public_id: session.userId,
        folder: "profiles",
        overwrite: true,
        eager: [{ width: 500, height: 500, crop: "fill", gravity: "face", quality: "auto:good" }],
        eager_async: false,
      });
    } catch {
      throw new InternalServerError("Failed to upload image");
    }

    const profile = await this.service.updateProfilePicture({
      userId: session.userId,
      pictureUrl,
    });

    return c.json(
      SuccessViewModel.create({ data: profile, message: "Profile picture updated", code: "PROFILE_PICTURE_UPDATED" }),
      200,
    );
  };
}
