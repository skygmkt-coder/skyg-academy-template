import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles")
      .select("is_admin, is_super_admin").eq("id", user.id).single();
    if (!profile?.is_admin && !profile?.is_super_admin)
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();
    if (!title) return NextResponse.json({ error: "El título es requerido" }, { status: 400 });

    const slug = title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "").trim()
      .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 100);

    const price = Math.round(parseFloat((formData.get("price") as string) || "0") * 100);
    const scheduledAt = formData.get("scheduled_at") as string;
    const durationHours = parseFloat((formData.get("duration_hours") as string) || "0");

    // Handle thumbnail upload
    let thumbnailUrl = (formData.get("thumbnail_url") as string) || null;
    const thumbnailFile = formData.get("thumbnail_file") as File | null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const admin = createAdminClient();
      const ext = thumbnailFile.name.split(".").pop() || "jpg";
      const filename = `thumbnails/course-${slug}-${Date.now()}.${ext}`;
      const buffer = await thumbnailFile.arrayBuffer();
      const { data: up } = await admin.storage.from("brand-assets")
        .upload(filename, buffer, { contentType: thumbnailFile.type, upsert: true });
      if (up) {
        const { data: { publicUrl } } = admin.storage.from("brand-assets").getPublicUrl(up.path);
        thumbnailUrl = publicUrl;
      }
    }

    const { data: course, error } = await supabase.from("courses").insert({
      title, slug,
      description: (formData.get("description") as string) || null,
      price_cents: price,
      published: false,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      thumbnail_url: thumbnailUrl,
      promo_video_url: (formData.get("promo_video_url") as string) || null,
      level: (formData.get("level") as string) || null,
      duration_minutes: durationHours ? Math.round(durationHours * 60) : null,
      course_type: (formData.get("course_type") as string) || "course",
      show_in_landing: formData.get("show_in_landing") === "on",
      show_in_store: formData.get("show_in_store") === "on",
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: course.id, slug: course.slug });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error inesperado" }, { status: 500 });
  }
}
