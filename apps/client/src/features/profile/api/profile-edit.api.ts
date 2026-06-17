import type { FullProfile } from "@/dal/orval/fetch/schemas/fullProfile";
import apiFetcher from "@/lib/api-fetcher";

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"];

type SuccessEnvelope<T> = { success: boolean; data: T };

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
  const res = await apiFetcher<SuccessEnvelope<{ available: boolean }>>(
    `/api/v1/profiles/check-username/${encodeURIComponent(username)}`,
    { method: "GET" },
  );
  return res.data;
}

export async function uploadAvatar(file: File): Promise<FullProfile> {
  const formData = new FormData();
  formData.append("file", file);
  // Do NOT set Content-Type — the browser sets the multipart boundary.
  const res = await apiFetcher<SuccessEnvelope<FullProfile>>(
    "/api/v1/profiles/@me/avatar",
    { method: "POST", body: formData },
  );
  return res.data;
}

export async function deleteAvatar(): Promise<FullProfile> {
  const res = await apiFetcher<SuccessEnvelope<FullProfile>>(
    "/api/v1/profiles/@me/avatar",
    { method: "DELETE" },
  );
  return res.data;
}
