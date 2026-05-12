import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll(){ return cookieStore.getAll() }, setAll(c){ try{ c.forEach(({name,value,options})=>cookieStore.set(name,value,options))}catch{} } } }
  );
}

function getEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.includes("v=") ? url.split("v=")[1]?.split("&")[0] : url.split("/").pop();
    return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&modestbranding=1`;
  }
  if (url.includes("vimeo.com")) {
    const id = url.split("/").pop();
    return `https://player.vimeo.com/video/${id}?title=0&byline=0`;
  }
  return url;
}

export default async function LessonPage({ params }: { params: { slug: string; lessonId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses").select("*, modules(*, lessons(id,title,video_url,order_index,is_free_preview))")
    .eq("slug", params.slug).single();
  if (!course) notFound();

  const { data: enrollment } = await supabase.from("enrollments")
    .select("id").eq("user_id", user.id).eq("course_id", course.id).eq("active", true).single();
  if (!enrollment) redirect(`/cursos/${params.slug}?access=denied`);

  // Flatten lessons
  const allLessons = course.modules
    ?.sort((a: any, b: any) => a.order_index - b.order_index)
    .flatMap((m: any) => m.lessons?.sort((a: any, b: any) => a.order_index - b.order_index).map((l: any) => ({...l, moduleTitle: m.title})) || []) || [];

  const currentLesson = allLessons.find((l: any) => l.id === params.lessonId) || allLessons[0];
  const currentIndex = allLessons.findIndex((l: any) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const embedUrl = getEmbedUrl(currentLesson?.video_url || "");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      {/* Top nav */}
      <nav className="glass border-b border-white/5 sticky top-0 z-50 flex-shrink-0">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted hover:text-white transition-colors text-sm">
              ← Dashboard
            </Link>
            <span className="text-white/20">|</span>
            <span className="font-display font-semibold text-white text-sm truncate max-w-xs">{course.title}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span>{currentIndex + 1} / {allLessons.length} lecciones</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-6">
            {/* Player */}
            <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden mb-6 shadow-card border border-white/5">
              {embedUrl ? (
                <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                    <span className="text-4xl">▶</span>
                  </div>
                  <p className="text-muted text-sm">Video no disponible</p>
                </div>
              )}
            </div>

            {/* Lesson info */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-primary font-semibold mb-1 uppercase tracking-wide">{currentLesson?.moduleTitle}</p>
                <h1 className="font-display text-2xl font-bold text-white">{currentLesson?.title}</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {prevLesson && (
                  <Link href={`/learn/${params.slug}/${prevLesson.id}`}
                    className="glass glass-hover text-sm text-muted px-4 py-2 rounded-xl border border-white/5 transition-all">
                    ← Anterior
                  </Link>
                )}
                {nextLesson && (
                  <Link href={`/learn/${params.slug}/${nextLesson.id}`}
                    className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-xl transition-all">
                    Siguiente →
                  </Link>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="glass rounded-2xl p-5 border border-white/5 mb-4">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-muted">Progreso del curso</span>
                <span className="text-primary font-semibold">{Math.round(((currentIndex + 1) / allLessons.length) * 100)}%</span>
              </div>
              <div className="bg-white/5 rounded-full h-2">
                <div className="bg-gradient-to-r from-primary to-primary-dark h-2 rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / allLessons.length) * 100}%` }} />
              </div>
            </div>

            {/* No more lessons */}
            {!nextLesson && (
              <div className="glass rounded-2xl p-8 border border-primary/20 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="font-display font-bold text-white text-xl mb-2">¡Completaste el curso!</h3>
                <p className="text-muted text-sm mb-5">Has terminado todas las lecciones. Tu certificado está disponible.</p>
                <button className="bg-primary text-white font-semibold px-8 py-3 rounded-full hover:shadow-glow transition-all">
                  Descargar certificado
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lessons sidebar */}
        <aside className="w-80 xl:w-96 glass border-l border-white/5 overflow-y-auto flex-shrink-0 hidden lg:block">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-display font-semibold text-white text-sm">Contenido del curso</h3>
            <p className="text-xs text-muted mt-1">{allLessons.length} lecciones</p>
          </div>
          <div className="p-2">
            {course.modules?.sort((a: any, b: any) => a.order_index - b.order_index).map((module: any) => (
              <div key={module.id} className="mb-2">
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">{module.title}</p>
                </div>
                {module.lessons?.sort((a: any, b: any) => a.order_index - b.order_index).map((lesson: any) => {
                  const isActive = lesson.id === currentLesson?.id;
                  const lessonIdx = allLessons.findIndex((l: any) => l.id === lesson.id);
                  const isDone = lessonIdx < currentIndex;
                  return (
                    <Link key={lesson.id}
                      href={`/learn/${params.slug}/${lesson.id}`}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all group ${
                        isActive ? "bg-primary/15 border border-primary/20" : "hover:bg-white/5"
                      }`}>
                      <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-xs transition-all ${
                        isActive ? "bg-primary border-primary text-white" :
                        isDone ? "bg-green-500/20 border-green-500/40 text-green-400" :
                        "border-white/15 text-muted"
                      }`}>
                        {isDone ? "✓" : isActive ? "▶" : (lessonIdx + 1)}
                      </div>
                      <span className={`text-sm leading-tight ${isActive ? "text-white font-medium" : "text-muted group-hover:text-white"}`}>
                        {lesson.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
