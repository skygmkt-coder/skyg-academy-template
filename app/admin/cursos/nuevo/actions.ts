"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient as adminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(c: any[]) {
          try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
}

export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = formData.get("title") as string;
  const slug = title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-");

  const price = Math.round(parseFloat((formData.get("price") as string) || "0") * 100);
  const scheduledAt = formData.get("scheduled_at") as string;
  const durationHours = parseFloat((formData.get("duration_hours") as string) || "0");

  // Handle thumbnail upload if file provided
  let thumbnailUrl = (formData.get("thumbnail_url") as string) || null;
  const thumbnailFile = formData.get("thumbnail_file") as File;

  if (thumbnailFile && thumbnailFile.size > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = adminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const ext = thumbnailFile.name.split(".").pop();
    const filename = `course-${slug}-${Date.now()}.${ext}`;
    const buffer = await thumbnailFile.arrayBuffer();

    const { data: uploadData, error } = await admin.storage
      .from("brand-assets")
      .upload(`thumbnails/${filename}`, buffer, {
        contentType: thumbnailFile.type,
        upsert: true,
      });

    if (!error && uploadData) {
      const { data: { publicUrl } } = admin.storage
        .from("brand-assets")
        .getPublicUrl(uploadData.path);
      thumbnailUrl = publicUrl;
    }
  }

  const { data, error } = await supabase.from("courses").insert({
    title,
    slug,
    description: formData.get("description"),
    price_cents: price,
    published: false,
    scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    thumbnail_url: thumbnailUrl,
    promo_video_url: formData.get("promo_video_url") || null,
    level: formData.get("level") || null,
    duration_minutes: durationHours ? Math.round(durationHours * 60) : null,
  }).select().single();

  if (error) redirect(`/admin/cursos/nuevo?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/cursos/${data.id}`);
}
