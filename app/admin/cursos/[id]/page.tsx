import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { togglePublish, addModule, addLesson } from "./actions";

function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll(){ return cookieStore.getAll() }, setAll(c){ try{ c.forEach(({name,value,options})=>cookieStore.set(name,value,options))}catch{} } } }
  );
}

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: course } = await supabase.from("courses")
    .select("*, modules(*, lessons(*))").eq("id", params.id).single();
  if (!course) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-muted hover:text-white text-sm">← Admin</Link>
        <h1 className="font-display text-2xl font-bold text-white flex-1">{course.title}</h1>
        <form action={async () => { "use server"; await togglePublish(course.id, course.published); }}>
          <button type="submit"
            className={`text-sm px-5 py-2 rounded-xl font-medium transition-all ${course.published ? "bg-white/10 text-white hover:bg-white/15" : "bg-primary text-white hover:bg-primary-dark"}`}>
            {course.published ? "Despublicar" : "Publicar"}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/5 mb-6 text-sm text-muted">
        <span className="text-white font-medium">URL pública:</span>{" "}
        <a href={`/cursos/${course.slug}`} target="_blank" className="text-primary hover:underline">/cursos/{course.slug}</a>
        {" · "}<span className="text-white font-medium">Precio:</span> ${(course.price_cents/100).toLocaleString()} MXN
        {" · "}<span className={course.published ? "text-green-400" : "text-muted"}>
          {course.published ? "✓ Publicado" : "Borrador"}
        </span>
      </div>

      {/* Modules */}
      <h2 className="font-display text-lg font-semibold text-white mb-4">Módulos y lecciones</h2>
      <div className="space-y-4 mb-6">
        {course.modules?.sort((a: any,b: any)=>a.order_index-b.order_index).map((module: any) => (
          <div key={module.id} className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-white">{module.title}</h3>
              <span className="text-xs text-muted">{module.lessons?.length || 0} lecciones</span>
            </div>
            {module.lessons?.sort((a: any,b: any)=>a.order_index-b.order_index).map((lesson: any) => (
              <div key={lesson.id} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-muted text-xs">▶</span>
                  <span className="text-sm text-white">{lesson.title}</span>
                  {lesson.is_free_preview && <span className="text-xs text-primary border border-primary/30 px-2 py-0.5 rounded-full">Preview</span>}
                </div>
                <span className="text-xs text-muted truncate max-w-[140px]">{lesson.video_url || "Sin video"}</span>
              </div>
            ))}
            {/* Add lesson form */}
            <form action={async (fd: FormData) => { "use server"; await addLesson(module.id, course.id, fd); }}
              className="p-4 border-t border-white/5 flex gap-3">
              <input name="title" placeholder="Título de lección" required
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-muted/50 focus:outline-none focus:border-primary/50" />
              <input name="video_url" placeholder="URL YouTube/Vimeo"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-muted/50 focus:outline-none focus:border-primary/50" />
              <label className="flex items-center gap-1 text-xs text-muted whitespace-nowrap">
                <input name="is_free_preview" type="checkbox" className="accent-primary" />Preview
              </label>
              <button type="submit" className="bg-primary/20 text-primary border border-primary/30 text-xs px-4 py-2 rounded-xl hover:bg-primary/30 transition-all whitespace-nowrap">
                + Lección
              </button>
            </form>
          </div>
        ))}
      </div>

      {/* Add module form */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-3">Agregar módulo</h3>
        <form action={async (fd: FormData) => { "use server"; await addModule(course.id, fd); }} className="flex gap-3">
          <input name="title" placeholder="Nombre del módulo" required
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted/50 focus:outline-none focus:border-primary/50" />
          <button type="submit" className="bg-primary text-white text-sm px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-all">
            + Módulo
          </button>
        </form>
      </div>
    </div>
  );
}
