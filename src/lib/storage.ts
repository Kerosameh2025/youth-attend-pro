import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";

export async function compressAndUploadPhoto(file: File, studentCode: string): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  });
  const ext = "jpg";
  const path = `${studentCode}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("student-photos").upload(path, compressed, {
    cacheControl: "3600",
    upsert: true,
    contentType: compressed.type || "image/jpeg",
  });
  if (error) throw error;
  return path;
}

export async function getSignedPhotoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("student-photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
