import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── Helper: require admin ──────────────────────────────
async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, supabase, error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_super_admin) {
    return { user: null, supabase, error: "Sin permisos de administrador" };
  }

  return { user, supabase, error: null };
}

// ── PATCH: Update course fields ────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error } = await getAdminUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json();

  // Whitelist allowed fields
  const allowed: Record<string, any> = {};
  const allowedKeys = [
    "title", "description", "price_cents", "level",
    "duration_minutes", "published", "scheduled_at",
    "thumbnail_url", "promo_video_url",
    "show_in_landing", "show_in_store", "course_type",
  ];
  for (const key of allowedKeys) {
    if (key in body) allowed[key] = body[key];
  }

  const { data, error: dbError } = await supabase
    .from("courses")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    console.error("[courses PATCH]", dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// ── POST: Course content actions ───────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error } = await getAdminUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json();

  switch (body.action) {

    // ── MODULES ──────────────────────────────────────────
    case "add_module": {
      const { data: last } = await supabase
        .from("modules")
        .select("order_index")
        .eq("course_id", id)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      const nextIndex = (last?.order_index ?? -1) + 1;

      const { data, error: dbError } = await supabase
        .from("modules")
        .insert({
          course_id: id,
          title: body.title || "Módulo sin título",
          order_index: nextIndex,
        })
        .select()
        .single();

      if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
      return NextResponse.json({ module: data });
    }

    case "update_module": {
      const { error: dbError } = await supabase
        .from("modules")
        .update({ title: body.title })
        .eq("id", body.module_id);

      if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "delete_module": {
      const { error: dbError } = await supabase
        .from("modules")
        .delete()
        .eq("id", body.module_id);

      if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── LESSONS ── (lessons use 'position', NOT order_index) ──
    case "add_lesson": {
      // Get the next position value for this module
      const { data: last } = await supabase
        .from("lessons")
        .select("position")
        .eq("module_id", body.module_id)
        .order("position", { ascending: false })
        .limit(1)
        .single();

      const nextPosition = (last?.position ?? -1) + 1;

      const { data, error: dbError } = await supabase
        .from("lessons")
        .insert({
          module_id: body.module_id,
          title: body.title || "Lección sin título",
          video_url: body.video_url || null,
          is_free_preview: body.is_free_preview ?? false,
          position: nextPosition,          // ← lessons use 'position'
        })
        .select()
        .single();

      if (dbError) {
        console.error("[add_lesson] DB error:", dbError);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }

      // Return lesson with order_index alias for client compatibility
      return NextResponse.json({
        lesson: {
          ...data,
          order_index: data.position ?? 0,
        },
      });
    }

    case "update_lesson": {
      const { error: dbError } = await supabase
        .from("lessons")
        .update({
          title: body.title,
          video_url: body.video_url || null,
          is_free_preview: body.is_free_preview ?? false,
        })
        .eq("id", body.lesson_id);

      if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "delete_lesson": {
      const { error: dbError } = await supabase
        .from("lessons")
        .delete()
        .eq("id", body.lesson_id);

      if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "delete_course": {
      const { error: dbError } = await supabase
        .from("courses")
        .delete()
        .eq("id", id);

      if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  }
}
