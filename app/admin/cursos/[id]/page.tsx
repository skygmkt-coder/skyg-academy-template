import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  updateCourse, togglePublish, deleteCourse,
  addModule, deleteModule, addLesson, deleteLesson
} from "./actions";

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

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (!course) notFound();

  const totalLessons = 0;

  const scheduledLocal = course.scheduled_at
    ? new Date(course.scheduled_at).toISOString().slice(0, 16)
    : "";

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-white/40 hover:text-white transition-colors">
            ← Admin
          </Link>
          <span className="text-white/20">/</span>
          <h1 className="font-display text-xl font-bold text-white truncate max-w-xs">{course.title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Publish toggle */}
          <form action={async () => { "use server"; await togglePublish(course.id, course.published); }}>
            <button type="submit"
              className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all ${
                course.published
                  ? "bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25"
                  : "bg-primary text-white hover:bg-primary-dark"
              }`}>
              {course.published ? "✓ Publicado" : "Publicar"}
            </button>
          </form>
          {/* Delete */}
          <form action={async () => { "use server"; await deleteCourse(course.id); }}>
            <button type="submit"
              onClick={(e) => { if (!confirm("¿Eliminar este curso permanentemente?")) e.preventDefault(); }}
              className="text-sm px-4 py-2 rounded-xl font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all">
              Eliminar
            </button>
          </form>
        </div>
      </div>

      {/* Status bar */}
      <div className="glass rounded-xl px-5 py-3 border border-white/5 mb-6 flex items-center gap-5 text-xs text-white/40">
        <span className={`font-semibold ${course.published ? "text-green-400" : course.scheduled_at ? "text-amber-400" : "text-white/30"}`}>
          {course.published ? "● Publicado" : course.scheduled_at ? "◷ Programado" : "○ Borrador"}
        </span>
        <span>URL: <span className="text-primary">/cursos/{course.slug}</span></span>
        <span>{course.modules?.length || 0} módulos · {totalLessons} lecciones</span>
        <span>${(course.price_cents / 100).toLocaleString()} MXN</span>
      </div>

      {/* Edit form */}
      <div className="glass rounded-2xl p-6 border border-white/8 mb-6">
        <h2 className="font-display text-sm font-bold text-white/70 uppercase tracking-wider mb-4">
          Información del curso
        </h2>
        <form action={async (fd: FormData) => { "use server"; await updateCourse(course.id, fd); }}
          className="space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Título</label>
            <input name="title" defaultValue={course.title} required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Descripción</label>
            <textarea name="description" defaultValue={course.description || ""} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Precio (MXN)</label>
              <input name="price" type="number" defaultValue={course.price_cents / 100} min="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Programar publicación</label>
              <input name="scheduled_at" type="datetime-local" defaultValue={scheduledLocal}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white/70 text-sm focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
          </div>
          <button type="submit"
            className="bg-primary/20 text-primary border border-primary/30 text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary/30 transition-all">
            Guardar cambios
          </button>
        </form>
      </div>

      {/* Modules & Lessons */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-white/70 uppercase tracking-wider">
          Contenido del curso
        </h2>
      </div>

      <div className="space-y-3 mb-4">
        {course.modules?.sort((a: any, b: any) => a.order_index - b.order_index).map((module: any) => (
          <div key={module.id} className="glass rounded-2xl border border-white/5 overflow-hidden">
            {/* Module header */}
            <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">{module.title}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30">{module.lessons?.length || 0} lecciones</span>
                <form action={async () => {
                  "use server";
                  await deleteModule(module.id, course.id);
                }}>
                  <button type="submit"
                    onClick={(e) => { if (!confirm("¿Eliminar módulo y todas sus lecciones?")) e.preventDefault(); }}
                    className="text-xs text-accent/60 hover:text-accent transition-colors">
                    Eliminar
                  </button>
                </form>
              </div>
            </div>

            {/* Lessons */}
            {module.lessons?.sort((a: any, b: any) => a.order_index - b.order_index).map((lesson: any) => (
              <div key={lesson.id}
                className="flex items-center justify-between px-5 py-3 border-b border-white/[0.03] last:border-0 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-white/20 text-xs shrink-0">▶</span>
                  <span className="text-sm text-white/70 truncate">{lesson.title}</span>
                  {lesson.is_free_preview && (
                    <span className="text-[10px] text-primary border border-primary/30 px-2 py-0.5 rounded-full shrink-0">
                      Preview
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-[10px] text-white/20 truncate max-w-[120px] hidden md:block">
                    {lesson.video_url ? "📹 Video" : "Sin video"}
                  </span>
                  <form action={async () => {
                    "use server";
                    await deleteLesson(lesson.id, course.id);
                  }}>
                    <button type="submit"
                      className="text-xs text-white/20 hover:text-accent transition-colors opacity-0 group-hover:opacity-100">
                      ×
                    </button>
                  </form>
                </div>
              </div>
            ))}

            {/* Add lesson form */}
            <form
              action={async (fd: FormData) => { "use server"; await addLesson(module.id, course.id, fd); }}
              className="p-3 border-t border-white/5 flex gap-2">
              <input name="title" placeholder="Título de lección" required
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-primary/40 min-w-0" />
              <input name="video_url" placeholder="URL YouTube/Vimeo"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-primary/40 min-w-0" />
              <label className="flex items-center gap-1 text-xs text-white/40 whitespace-nowrap shrink-0">
                <input name="is_free_preview" type="checkbox" className="accent-primary" />
                Preview
              </label>
              <button type="submit"
                className="bg-primary/15 text-primary border border-primary/25 text-xs px-3 py-2 rounded-lg hover:bg-primary/25 transition-all shrink-0 whitespace-nowrap">
                + Lección
              </button>
            </form>
          </div>
        ))}
      </div>

      {/* Add module */}
      <div className="glass rounded-2xl p-4 border border-white/5">
        <p className="text-xs text-white/40 mb-3 font-semibold uppercase tracking-wider">Agregar módulo</p>
        <form action={async (fd: FormData) => { "use server"; await addModule(course.id, fd); }}
          className="flex gap-3">
          <input name="title" placeholder="Nombre del módulo" required
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors" />
          <button type="submit"
            className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-all shrink-0">
            + Módulo
          </button>
        </form>
      </div>
    </div>
  );
}
