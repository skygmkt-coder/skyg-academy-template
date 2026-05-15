import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    // ── Auth & admin check ─────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, is_super_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin && !profile?.is_super_admin) {
      return NextResponse.json({ error: "Sin permisos de administrador" }, { status: 403 });
    }

    // ── Parse form data ────────────────────────────────
    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();

    if (!title) {
      return NextResponse.json({ error: "El título es requerido" }, { status: 400 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100);

    const price = Math.round(
      parseFloat((formData.get("price") as string) || "0") * 100
    );
    const scheduledAt = formData.get("scheduled_at") as string;
    const durationHours = parseFloat(
      (formData.get("duration_hours") as string) || "0"
    );
    const courseType = (formData.get("course_type") as string) || "course";
    const showInLanding = formData.get("show_in_landing") === "on";
    const showInStore = formData.get("show_in_store") === "on";
    const promoVideoUrl = (formData.get("promo_video_url") as string) || null;
    const description = (formData.get("description") as string) || null;
    const level = (formData.get("level") as string) || null;

    // ── Handle thumbnail upload ────────────────────────
    let thumbnailUrl = (formData.get("thumbnail_url") as string) || null;
    const thumbnailFile = formData.get("thumbnail_file") as File | null;

    if (thumbnailFile && thumbnailFile.size > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminDb = createAdminClient();
      const ext = thumbnailFile.name.split(".").pop() || "jpg";
      const filename = `thumbnails/course-${slug}-${Date.now()}.${ext}`;
      const buffer = await thumbnailFile.arrayBuffer();

      const { data: uploadData, error: uploadError } = await adminDb.storage
        .from("brand-assets")
        .upload(filename, buffer, {
          contentType: thumbnailFile.type,
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = adminDb.storage
          .from("brand-assets")
          .getPublicUrl(uploadData.path);
        thumbnailUrl = publicUrl;
      }
    }

    // ── Insert course ──────────────────────────────────
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        title,
        slug,
        description,
        price_cents: price,
        published: false,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        thumbnail_url: thumbnailUrl,
        promo_video_url: promoVideoUrl || null,
        level,
        duration_minutes: durationHours ? Math.round(durationHours * 60) : null,
        course_type: courseType,
        show_in_landing: showInLanding,
        show_in_store: showInStore,
      })
      .select()
      .single();

    if (courseError) {
      console.error("[create-course] DB error:", courseError);
      return NextResponse.json(
        { error: courseError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: course.id,
      slug: course.slug,
    });
  } catch (err: any) {
    console.error("[create-course] Unexpected error:", err);
    return NextResponse.json(
      { error: err?.message || "Error inesperado en el servidor" },
      { status: 500 }
    );
  }
}
