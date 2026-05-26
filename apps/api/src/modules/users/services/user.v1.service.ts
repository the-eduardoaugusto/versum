import { AuthRepository } from "../../auth/repositories/auth.repository";
import { db } from "../../../infrastructure/db";
import type { Profile } from "../repositories/profile.types.repository";
import { ProfileRepository } from "../repositories/profile.repository";
import { UserRepository } from "../repositories/user.repository";
import type {
  CreateUserParams,
  User,
} from "../repositories/user.types.repository";
import type { ExportUserData } from "../schemas/v1/users.v1.common.schema";

const MAX_EMAIL_LENGTH = 255;

export class UserServiceV1 {
  private readonly repository: UserRepository;
  private readonly authRepository: AuthRepository;
  private readonly profileRepository: ProfileRepository;
  private readonly transaction: typeof db.transaction;

  constructor({
    repository,
    authRepository,
    profileRepository,
    transaction,
  }: {
    repository?: UserRepository;
    authRepository?: AuthRepository;
    profileRepository?: ProfileRepository;
    transaction?: typeof db.transaction;
  } = {}) {
    this.repository = repository ?? new UserRepository();
    this.authRepository = authRepository ?? new AuthRepository();
    this.profileRepository = profileRepository ?? new ProfileRepository();
    this.transaction = transaction ?? db.transaction;
  }

  private validateEmail(email: string): void {
    const trimmed = email.trim().toLowerCase();

    if (trimmed.length === 0) {
      throw new Error("Email is required");
    }

    if (trimmed.length > MAX_EMAIL_LENGTH) {
      throw new Error(`Email must not exceed ${MAX_EMAIL_LENGTH} characters`);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new Error("Invalid email format");
    }
  }

  async createUser(params: CreateUserParams): Promise<User> {
    const normalizedEmail = params.email.trim().toLowerCase();
    this.validateEmail(normalizedEmail);

    return await this.repository.create({
      ...params,
      email: normalizedEmail,
    });
  }

  async getUserById({ id }: { id: string }): Promise<User> {
    const user = await this.repository.findById({ id });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getUserByIdWithProfile({ id }: { id: string }): Promise<User & { profile: Profile | undefined }> {
    const user = await this.repository.findByIdWithProfile({ id });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getUserByEmail({ email }: { email: string }): Promise<User | null> {
    return await this.repository.findByEmail({ email });
  }

  async updateUserEmail(params: { id: string; email: string }): Promise<User> {
    const user = await this.repository.findById({ id: params.id });

    if (!user) {
      throw new Error("User not found");
    }

    this.validateEmail(params.email);

    const normalizedEmail = params.email.trim().toLowerCase();

    const existingWithEmail = await this.repository.findByEmail({
      email: normalizedEmail,
    });

    if (existingWithEmail && existingWithEmail.id !== user.id) {
      throw new Error("Email already in use");
    }

    return await this.repository.updateUser({
      id: user.id,
      email: normalizedEmail,
    });
  }

  async deleteUser({ id }: { id: string }): Promise<void> {
    const user = await this.repository.findById({ id });

    if (!user) {
      throw new Error("User not found");
    }

    await this.transaction(async (tx) => {
      await this.authRepository.deleteSessionsByUserId({ userId: id }, tx as any);
      await this.profileRepository.deleteByUserId({ userId: id }, tx as any);
      await this.authRepository.deleteMagicLinksByEmail({ email: user.email }, tx as any);
      await this.repository.deleteUser({ id }, tx as any);
    });
  }

  async exportUserData({ id }: { id: string }): Promise<ExportUserData> {
    const data = await this.repository.findByIdWithAllData({ id });

    if (!data) {
      throw new Error("User not found");
    }

    const mapSessions = (s: unknown) => {
      const session = s as { createdAt: Date; expiresAt: Date };
      return {
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
      };
    };

    const mapJourneyReadings = (r: unknown) => {
      const reading = r as { chapterId: string; readAt: Date };
      return { chapterId: reading.chapterId, readAt: reading.readAt.toISOString() };
    };

    const mapDiscoveryReadings = (r: unknown) => {
      const reading = r as { verseId: string; readAt: Date };
      return { verseId: reading.verseId, readAt: reading.readAt.toISOString() };
    };

    const mapMarks = (m: unknown) => {
      const mark = m as { verseId: string; selectedVerseId: string; annotation: string | null; isPublic: boolean; createdAt: Date };
      return {
        verseId: mark.verseId,
        selectedVerseId: mark.selectedVerseId,
        annotation: mark.annotation ?? null,
        isPublic: mark.isPublic,
        createdAt: mark.createdAt.toISOString(),
      };
    };

    const mapLikes = (l: unknown) => {
      const like = l as { verseId: string; createdAt: Date };
      return { verseId: like.verseId, createdAt: like.createdAt.toISOString() };
    };

    const mapConsentLogs = (c: unknown) => {
      const log = c as { id: string; userId: string; purpose: string; granted: boolean; createdAt: Date };
      return {
        id: log.id,
        userId: log.userId,
        purpose: log.purpose,
        granted: log.granted,
        createdAt: log.createdAt.toISOString(),
      };
    };

    return {
      exportedAt: new Date().toISOString(),
      user: {
        email: data.email,
        createdAt: data.createdAt.toISOString(),
      },
      profile: data.profile
        ? {
            username: data.profile.username,
            name: data.profile.name,
            bio: data.profile.bio ?? null,
            pictureUrl: data.profile.pictureUrl ?? null,
          }
        : null,
      sessions: (data.sessions ?? []).map(mapSessions),
      readingHistory: {
        journey: (data.readings ?? []).map(mapJourneyReadings),
        discovery: (data.discoveryReadings ?? []).map(mapDiscoveryReadings),
      },
      annotations: (data.marks ?? []).map(mapMarks),
      likes: (data.likes ?? []).map(mapLikes),
      consentLogs: (data.consentLogs ?? []).map(mapConsentLogs),
    };
  }
}
