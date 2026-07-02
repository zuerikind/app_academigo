import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Supabase = SupabaseClient<Database>;

export function isValidCvFile(file: FormDataEntryValue | null): file is File {
  return (
    file instanceof File &&
    file.size > 0 &&
    file.size <= 5 * 1024 * 1024 && // 5 MB max
    ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)
  );
}

export async function uploadCv(
  supabase: Supabase,
  userId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const path = `${userId}/cv.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  // Private bucket — store path, retrieve signed URL when needed
  return { url: path };
}

export function isValidAvatarFile(file: FormDataEntryValue | null): file is File {
  return (
    file instanceof File &&
    file.size > 0 &&
    file.type.startsWith("image/")
  );
}

export async function uploadAvatar(
  supabase: Supabase,
  userId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `${userId}/avatar.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${urlData.publicUrl}?v=${Date.now()}`;
  return { url };
}
