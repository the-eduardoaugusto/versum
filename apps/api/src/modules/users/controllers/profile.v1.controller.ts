import type { Context } from "hono";
import type { Session } from "@/modules/auth/repositories/auth.types.repository";
import { BadRequestError, NotFoundError } from "@/utils/app/errors/index";
import { CloudinaryService } from "@/infrastructure/cloudinary/cloudinary.service.ts";
import { SuccessViewModel } from "@/view-models/default/success.view-model";
import { ProfileServiceV1 } from "../services/profile.v1.service";
import { assertValidAvatar } from "../utils/avatar-validation.ts";

export class ProfileControllerV1 {
  private readonly service: ProfileServiceV1;
  private readonly cloudinary: CloudinaryService;

  constructor({
    service,
    cloudinary,
  }: { service?: ProfileServiceV1; cloudinary?: CloudinaryService } = {}) {
    this.service = service ?? new ProfileServiceV1();
    this.cloudinary = cloudinary ?? new CloudinaryService();
  }

  createProfile = async (c: Context) => {
    const session = c.get("session") as Session;
    const body = await c.req.json();

    const profile = await this.service.createProfile({
      ...body,
      userId: session.userId,
    });

    return c.json(SuccessViewModel.create(profile), 201);
  };

  getAuthenticatedProfile = async (c: Context) => {
    const session = c.get("session") as Session;

    const profile = await this.service.getProfileByUserId({
      userId: session.userId,
    });

    if (!profile) {
      throw new NotFoundError("Profile not found");
    }

    return c.json(SuccessViewModel.create(profile), 200);
  };

  updateAuthenticatedProfile = async (c: Context) => {
    const session = c.get("session") as Session;
    const body = await c.req.json();

    const profile = await this.service.updateProfile({
      ...body,
      userId: session.userId,
    });

    return c.json(SuccessViewModel.create(profile), 200);
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

    return c.json(SuccessViewModel.create(profile), 200);
  };

  checkUsername = async (c: Context) => {
    const session = c.get("session") as Session;
    const username = c.req.param("username");

    if (!username) {
      throw new BadRequestError("Username is required");
    }

    const available = await this.service.isUsernameAvailable({
      username,
      currentUserId: session.userId,
    });

    return c.json(SuccessViewModel.create({ available }), 200);
  };

  uploadAvatar = async (c: Context) => {
    const session = c.get("session") as Session;

    const body = await c.req.parseBody();
    const file = body.file;

    if (!(file instanceof File)) {
      throw new BadRequestError("Avatar file is required");
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    assertValidAvatar({ mimeType: file.type, size: file.size, bytes });

    const secureUrl = await this.cloudinary.uploadAvatar({
      userId: session.userId,
      bytes: Buffer.from(arrayBuffer),
    });

    const profile = await this.service.updateProfile({
      userId: session.userId,
      pictureUrl: secureUrl,
    });

    return c.json(SuccessViewModel.create(profile), 200);
  };

  deleteAvatar = async (c: Context) => {
    const session = c.get("session") as Session;

    await this.cloudinary.destroyAvatar({ userId: session.userId });

    const profile = await this.service.updateProfile({
      userId: session.userId,
      pictureUrl: null,
    });

    return c.json(SuccessViewModel.create(profile), 200);
  };
}
