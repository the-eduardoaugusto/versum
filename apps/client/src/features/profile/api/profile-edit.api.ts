import {
  deleteApiV1ProfilesMeAvatar,
  getApiV1ProfilesCheckUsernameUsername,
  postApiV1ProfilesMeAvatar,
} from "@/dal/orval/fetch/profiles/profiles";

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"];

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_MIME.includes(file.type)) {
    return "A imagem deve ser JPEG, PNG ou WEBP.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "A imagem deve ter no máximo 5 MB.";
  }
  return null;
}

export async function checkUsername(
  username: string,
): Promise<{ available: boolean }> {
  const res = await getApiV1ProfilesCheckUsernameUsername(username);
  return res.data!;
}

export async function uploadAvatar(file: File) {
  const res = await postApiV1ProfilesMeAvatar({ file });
  return res.data;
}

export async function deleteAvatar() {
  const res = await deleteApiV1ProfilesMeAvatar();
  return res.data;
}
