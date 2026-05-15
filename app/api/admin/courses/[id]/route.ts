import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: "No autorizado" };
  const { data: p } = await supabase.from("profiles")
    .select("is_admin, is_super_admin").eq("id", user.id).single();
  if (!p?.is_admin && !p?.is_super_admin) return { user: null, error: "Sin permisos" };
  return { user, error: null };
}

async function getCoursePayload(adminDb: ReturnType<typeof createAdminClient>, courseId: string) {
  const { data, error } = await adminDb.from("courses").select(`
    id, title, slug, description, price_cents, level, duration_minutes,
    published, scheduled_at, thumbnail_url, promo_video_url,
    course_type, show_in_landing, show_in_store,
    modules (
      id, title, order_index,
      lessons ( id, title, video_url, resource_url, position, is_free_preview )
    )
  `).eq("id", courseId).single();

  if (error) throw error;

  return {
    ...data,
    modules: [...(data.modules || [])]
      .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((m: any) => ({
        ...m,
        lessons: [...(m.lessons || [])]
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          .map((l: any) => ({ ...l, order_index: l.position ?? 0 })),
      })),
  };
}

async function requireModuleInCourse(adminDb: ReturnType<typeof createAdminClient>, courseId: string, moduleId: string) {
  const { data, error } = await adminDb
    .from("modules")
    .select("id")
    .eq("id", moduleId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}


async function syncCourseContent(adminDb: ReturnType<typeof createAdminClient>, courseId: string, modules: any[]) {
  console.info("[admin course save_all] payload", {
    courseId,
    modules: modules.length,
    lessons: modules.reduce((sum, module) => sum + (Array.isArray(module.lessons) ? module.lessons.length : 0), 0),
  });

  for (const [moduleIndex, module] of modules.entries()) {
    const orderIndex = module.order_index ?? moduleIndex;

    if (!module.id) {
      const { data: createdModule, error } = await adminDb.from("modules").insert({
        course_id: courseId,
        title: module.title || "Módulo sin título",
        order_index: orderIndex,
      }).select("id, course_id, order_index").single();
      if (error) throw error;
      module.id = createdModule.id;
      console.info("[admin course save_all] module inserted", createdModule);
    } else {
      const { data: updatedModule, error } = await adminDb.from("modules")
        .update({
          title: module.title || "Módulo sin título",
          order_index: orderIndex,
        })
        .eq("id", module.id)
        .eq("course_id", courseId)
        .select("id, course_id, order_index")
        .single();
      if (error) throw error;
      console.info("[admin course save_all] module saved", updatedModule);
    }

    for (const [lessonIndex, lesson] of [...(module.lessons || [])].entries()) {
      const position = lesson.order_index ?? lesson.position ?? lessonIndex;
      const lessonPayload = {
        module_id: module.id,
        title: lesson.title || "Lección sin título",
        video_url: lesson.video_url || null,
        resource_url: lesson.resource_url || null,
        is_free_preview: lesson.is_free_preview ?? false,
        position,
        order_index: position,
      };

      if (!lesson.id) {
        const { data: createdLesson, error } = await adminDb.from("lessons")
          .insert(lessonPayload)
          .select("id, module_id, position, order_index")
          .single();
        if (error) throw error;
        lesson.id = createdLesson.id;
        console.info("[admin course save_all] lesson inserted", createdLesson);
      } else {
        const { data: updatedLesson, error } = await adminDb.from("lessons")
          .update(lessonPayload)
          .eq("id", lesson.id)
          .eq("module_id", module.id)
          .select("id, module_id, position, order_index")
          .single();
        if (error) throw error;
        console.info("[admin course save_all] lesson saved", updatedLesson);
      }
    }
  }
}

function actionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Error inesperado";
  console.error("[admin course action]", error);
  return NextResponse.json({ error: message }, { status: 500 });
}

// ── PATCH: Update course (publish, details, visibility) ──
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, error } = await requireAdmin();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json();
  const allowed: Record<string, any> = {};
  const keys = ["title","description","price_cents","level","duration_minutes",
    "published","scheduled_at","thumbnail_url","promo_video_url",
    "show_in_landing","show_in_store","course_type"];
  for (const k of keys) if (k in body) allowed[k] = body[k];

  const adminDb = createAdminClient();
  const { data: updatedCourse, error: dbErr } = await adminDb
    .from("courses")
    .update(allowed)
    .eq("id", id)
    .select("id")
    .single();
  if (dbErr) {
    console.error("[PATCH courses] DB error:", dbErr);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }
  console.info("[PATCH courses] course persisted", { courseId: updatedCourse.id });

  try {
    const course = await getCoursePayload(adminDb, id);
    return NextResponse.json(course);
  } catch (err) {
    return actionError(err);
  }
}

// ── POST: Content actions ──────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, error } = await requireAdmin();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json();
  const adminDb = createAdminClient();
  console.info("[admin course action] received", { courseId: id, action: body.action });

  try {
    switch (body.action) {
      case "add_module": {
        const { data: last, error: lastError } = await adminDb.from("modules")
          .select("order_index").eq("course_id", id)
          .order("order_index", { ascending: false }).limit(1).maybeSingle();
        if (lastError) throw lastError;

        const { data: created, error: e } = await adminDb.from("modules").insert({
          course_id: id,
          title: body.title || "Módulo sin título",
          order_index: (last?.order_index ?? -1) + 1,
        }).select("id, course_id, order_index").single();
        if (e) throw e;
        console.info("[admin course action] module persisted", created);
        break;
      }

      case "update_module": {
        const belongs = await requireModuleInCourse(adminDb, id, body.module_id);
        if (!belongs) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });

        const { data: updated, error: e } = await adminDb.from("modules")
          .update({ title: body.title || "Módulo sin título" })
          .eq("id", body.module_id)
          .eq("course_id", id)
          .select("id, course_id, order_index")
          .single();
        if (e) throw e;
        console.info("[admin course action] module updated", updated);
        break;
      }

      case "delete_module": {
        const belongs = await requireModuleInCourse(adminDb, id, body.module_id);
        if (!belongs) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });

        const { error: e, count } = await adminDb.from("modules")
          .delete({ count: "exact" })
          .eq("id", body.module_id)
          .eq("course_id", id);
        if (e) throw e;
        console.info("[admin course action] module deleted", { moduleId: body.module_id, count });
        break;
      }

      case "add_lesson": {
        const belongs = await requireModuleInCourse(adminDb, id, body.module_id);
        if (!belongs) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });

        const { data: last, error: lastError } = await adminDb.from("lessons")
          .select("position").eq("module_id", body.module_id)
          .order("position", { ascending: false }).limit(1).maybeSingle();
        if (lastError) throw lastError;

        const { data: created, error: e } = await adminDb.from("lessons").insert({
          module_id: body.module_id,
          title: body.title || "Lección sin título",
          video_url: body.video_url || null,
          resource_url: body.resource_url || null,
          is_free_preview: body.is_free_preview ?? false,
          position: (last?.position ?? -1) + 1,
        }).select("id, module_id, position, order_index").single();
        if (e) throw e;
        console.info("[admin course action] lesson persisted", created);
        break;
      }

      case "update_lesson": {
        const belongs = await requireModuleInCourse(adminDb, id, body.module_id);
        if (!belongs) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });

        const { data: updated, error: e } = await adminDb.from("lessons").update({
          title: body.title || "Lección sin título",
          video_url: body.video_url || null,
          resource_url: body.resource_url || null,
          is_free_preview: body.is_free_preview ?? false,
        })
          .eq("id", body.lesson_id)
          .eq("module_id", body.module_id)
          .select("id, module_id, position, order_index")
          .single();
        if (e) throw e;
        console.info("[admin course action] lesson updated", updated);
        break;
      }

      case "delete_lesson": {
        const belongs = await requireModuleInCourse(adminDb, id, body.module_id);
        if (!belongs) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });

        const { error: e, count } = await adminDb.from("lessons")
          .delete({ count: "exact" })
          .eq("id", body.lesson_id)
          .eq("module_id", body.module_id);
        if (e) throw e;
        console.info("[admin course action] lesson deleted", { lessonId: body.lesson_id, count });
        break;
      }

      case "save_course_content": {
        await syncCourseContent(adminDb, id, Array.isArray(body.modules) ? body.modules : []);
        break;
      }

      case "delete_course": {
        const { error: enrollmentError } = await adminDb.from("enrollments").delete().eq("course_id", id);
        if (enrollmentError) throw enrollmentError;
        const { error: e } = await adminDb.from("courses").delete().eq("id", id);
        if (e) throw e;
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
    }

    const course = await getCoursePayload(adminDb, id);
    return NextResponse.json({ success: true, course });
  } catch (err) {
    return actionError(err);
  }
}
