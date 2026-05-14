import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function admin() {
  return adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles")
    .select("is_admin, is_super_admin").eq("id", user.id).single();
  if (!p?.is_admin && !p?.is_super_admin) return null;
  return user;
}

// ── UPDATE COURSE DETAILS ─────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const db = admin();

  const updateData: Record<string, any> = {};
  const allowed = ["title","description","price_cents","level","duration_minutes",
    "promo_video_url","thumbnail_url","published","scheduled_at",
    "show_in_landing","show_in_store","course_type"];

  for (const key of allowed) {
    if (key in body) updateData[key] = body[key];
  }

  const { error } = await db.from("courses").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/admin/cursos/${id}`);
  revalidatePath("/admin");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

// ── ADD MODULE ────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const db = admin();

  if (body.action === "add_module") {
    const { data: last } = await db.from("modules")
      .select("order_index").eq("course_id", id)
      .order("order_index", { ascending: false }).limit(1).single();

    const { data, error } = await db.from("modules").insert({
      course_id: id,
      title: body.title || "Módulo sin título",
      order_index: (last?.order_index ?? -1) + 1,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath(`/admin/cursos/${id}`);
    return NextResponse.json({ module: data });
  }

  if (body.action === "add_lesson") {
    const { data: last } = await db.from("lessons")
      .select("order_index").eq("module_id", body.module_id)
      .order("order_index", { ascending: false }).limit(1).single();

    const { data, error } = await db.from("lessons").insert({
      module_id: body.module_id,
      title: body.title || "Lección sin título",
      video_url: body.video_url || null,
      is_free_preview: body.is_free_preview || false,
      order_index: (last?.order_index ?? -1) + 1,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ lesson: data });
  }

  if (body.action === "delete_module") {
    await db.from("modules").delete().eq("id", body.module_id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete_lesson") {
    await db.from("lessons").delete().eq("id", body.lesson_id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update_lesson") {
    const { data, error } = await db.from("lessons").update({
      title: body.title,
      video_url: body.video_url || null,
      is_free_preview: body.is_free_preview || false,
    }).eq("id", body.lesson_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ lesson: data });
  }

  if (body.action === "update_module") {
    const { data, error } = await db.from("modules").update({
      title: body.title,
    }).eq("id", body.module_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ module: data });
  }

  if (body.action === "delete_course") {
    await db.from("courses").delete().eq("id", id);
    revalidatePath("/admin/cursos");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
