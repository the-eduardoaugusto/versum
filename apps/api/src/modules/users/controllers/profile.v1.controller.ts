import type { Context } from "hono";
import type { Session } from "@/modules/auth/repositories/auth.types.repository";
import { BadRequestError, NotFoundError } from "@/utils/app/errors/index";
import { SuccessViewModel } from "@/view-models/default/success.view-model";
import { ProfileServiceV1 } from "../services/profile.v1.service";
import { assertValidAvatar } from "../utils/avatar-validation.ts";
import { S3Service } from "@/infrastructure/s3/s3.service.ts";
import { prepareAvatar } from "../utils/avatar-image.ts";
import type { Profile } from "../repositories/profile.types.repository.ts";

export class ProfileControllerV1 {
  private readonly service: ProfileServiceV1;
  private readonly s3: S3Service;

  constructor({
    service,
    s3,
  }: { service?: ProfileServiceV1; s3?: S3Service } = {}) {
    this.service = service ?? new ProfileServiceV1();
    this.s3 = s3 ?? new S3Service();
  }

  private async toProfileResponse(profile: Profile): Promise<(Omit<Profile, "avatarUpdatedAt"> & { avatarUrl: string | null })> {
    if (profile.avatarUpdatedAt === null) {
      return { ...profile, avatarUrl: null };
    }

    const avatarUrl = await this.s3.getAvatarUrl({
      userId: profile.userId,
      avatarUpdatedAt: profile.avatarUpdatedAt,
    });

    const { avatarUpdatedAt, ...profileWithoutAvatarUpdatedAt } = profile;

    return { ...profileWithoutAvatarUpdatedAt, avatarUrl };
  }

  createProfile = async (c: Context) => {
    const session = c.get("session") as Session;
    const body = await c.req.json();

    const profile = await this.service.createProfile({
      ...body,
      userId: session.userId,
    });

    return c.json(
      SuccessViewModel.create({
        data: await this.toProfileResponse(profile),
        message: "Profile created",
        code: "PROFILE_CREATED",
      }),
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
      SuccessViewModel.create({
        data: await this.toProfileResponse(profile),
        message: "Profile retrieved",
        code: "PROFILE_RETRIEVED",
      }),
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
      SuccessViewModel.create({
        data: await this.toProfileResponse(profile),
        message: "Profile updated",
        code: "PROFILE_UPDATED",
      }),
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
      SuccessViewModel.create({
        data: await this.toProfileResponse(profile),
        message: "Profile retrieved",
        code: "PROFILE_RETRIEVED",
      }),
      200,
    );
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

    return c.json(
      SuccessViewModel.create({
        data: { available },
        message: "Username availability checked",
        code: "USERNAME_AVAILABILITY_CHECKED",
      }),
      200,
    );
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

    await this.service.assertProfileEditable({ userId: session.userId });

    const preparedBytes = await prepareAvatar(bytes);
    const oldProfile = await this.service.getProfileByUserId({ userId: session.userId });

    if (oldProfile?.avatarUpdatedAt) {
      await this.s3.destroyAvatar({ userId: session.userId, avatarUpdatedAt: oldProfile.avatarUpdatedAt });
    }

    const avatarUpdatedAt = new Date();
    await this.s3.uploadAvatarWebp({
      userId: session.userId,
      bytes: preparedBytes,
      avatarUpdatedAt
    })

    const profile = await this.service.setAvatarUpdatedAt({
      userId: session.userId,
      avatarUpdatedAt
    });

    return c.json(
      SuccessViewModel.create({
        data: await this.toProfileResponse(profile),
        message: "Avatar updated",
        code: "AVATAR_UPDATED",
      }),
      200,
    );
  };

  deleteAvatar = async (c: Context) => {
    const session = c.get("session") as Session;

    const profile = await this.service.assertProfileEditable({
      userId: session.userId,
    });

    if (!profile.avatarUpdatedAt) {
      throw new BadRequestError("No avatar to delete");
    }
    await this.s3.destroyAvatar({ userId: session.userId, avatarUpdatedAt: profile.avatarUpdatedAt });
    const updatedProfile = await this.service.clearAvatar({ userId: session.userId });

    return c.json(
      SuccessViewModel.create({
        data: await this.toProfileResponse(updatedProfile),
        message: "Avatar removed",
        code: "AVATAR_REMOVED",
      }),
      200,
    );
  };
}
