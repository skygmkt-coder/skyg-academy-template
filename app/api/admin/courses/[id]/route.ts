import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, supabase, error: "No autorizado" };
  const { data: p } = await supabase.from("profiles")
    .select("is_admin, is_super_admin").eq("id", user.id).single();
  if (!p?.is_admin && !p?.is_super_admin) return { user: null, supabase, error: "Sin permisos" };
  return { user, supabase, error: null };
}

// ── PATCH: Update course (publish, details, visibility) ──
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await requireAdmin();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json();
  const allowed: Record<string, any> = {};
  const keys = ["title","description","price_cents","level","duration_minutes",
    "published","scheduled_at","thumbnail_url","promo_video_url",
    "show_in_landing","show_in_store","course_type"];
  for (const k of keys) if (k in body) allowed[k] = body[k];

  const { data, error: dbErr } = await supabase
    .from("courses").update(allowed).eq("id", id).select().single();
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── POST: Content actions ──────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await requireAdmin();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json();

  switch (body.action) {
    case "add_module": {
      const { data: last } = await supabase.from("modules")
        .select("order_index").eq("course_id", id)
        .order("order_index", { ascending: false }).limit(1).single();
      const { data, error: e } = await supabase.from("modules").insert({
        course_id: id, title: body.title || "Módulo sin título",
        order_index: (last?.order_index ?? -1) + 1,
      }).select().single();
      if (e) return NextResponse.json({ error: e.message }, { status: 500 });
      return NextResponse.json({ module: data });
    }

    case "update_module": {
      const { error: e } = await supabase.from("modules")
        .update({ title: body.title }).eq("id", body.module_id);
      if (e) return NextResponse.json({ error: e.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "delete_module": {
      // Cascade: delete lessons first, then module
      await supabase.from("lessons").delete().eq("module_id", body.module_id);
      const { error: e } = await supabase.from("modules").delete().eq("id", body.module_id);
      if (e) return NextResponse.json({ error: e.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "add_lesson": {
      // lessons use 'position' column
      const { data: last } = await supabase.from("lessons")
        .select("position").eq("module_id", body.module_id)
        .order("position", { ascending: false }).limit(1).single();
      const { data, error: e } = await supabase.from("lessons").insert({
        module_id: body.module_id,
        title: body.title || "Lección sin título",
        video_url: body.video_url || null,
        is_free_preview: body.is_free_preview ?? false,
        position: (last?.position ?? -1) + 1,
      }).select().single();
      if (e) { console.error("add_lesson error:", e); return NextResponse.json({ error: e.message }, { status: 500 }); }
      // Return with order_index alias for client compatibility
      return NextResponse.json({ lesson: { ...data, order_index: data.position ?? 0 } });
    }

    case "update_lesson": {
      const { error: e } = await supabase.from("lessons").update({
        title: body.title,
        video_url: body.video_url || null,
        is_free_preview: body.is_free_preview ?? false,
      }).eq("id", body.lesson_id);
      if (e) return NextResponse.json({ error: e.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "delete_lesson": {
      const { error: e } = await supabase.from("lessons").delete().eq("id", body.lesson_id);
      if (e) return NextResponse.json({ error: e.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "delete_course": {
      // Safe cascade: lessons → modules → course
      const { data: modules } = await supabase.from("modules")
        .select("id").eq("course_id", id);
      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);
        await supabase.from("lessons").delete().in("module_id", moduleIds);
      }
      await supabase.from("modules").delete().eq("course_id", id);
      await supabase.from("enrollments").delete().eq("course_id", id);
      const { error: e } = await supabase.from("courses").delete().eq("id", id);
      if (e) return NextResponse.json({ error: e.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  }
}
