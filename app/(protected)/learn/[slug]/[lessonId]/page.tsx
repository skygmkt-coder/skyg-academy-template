import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) =>
                cookieStore.set(
                  name,
                  value,
                  options
                )
            );
          } catch {}
        },
      },
    }
  );
}

function getEmbedUrl(url: string): string {
  if (!url) return "";

  if (
    url.includes("youtube.com") ||
    url.includes("youtu.be")
  ) {
    const id = url.includes("v=")
      ? url
          .split("v=")[1]
          ?.split("&")[0]
      : url.split("/").pop();

    return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&modestbranding=1`;
  }

  if (url.includes("vimeo.com")) {
    const id = url.split("/").pop();

    return `https://player.vimeo.com/video/${id}?title=0&byline=0`;
  }

  return url;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{
    slug: string;
    lessonId: string;
  }>;
}) {
  const resolvedParams = await params;

  const { slug, lessonId } =
    resolvedParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: course } =
    await supabase
      .from("courses")
      .select(
        "*, modules(*, lessons(id,title,video_url,order_index,is_free_preview))"
      )
      .eq("slug", slug)
      .single();

  if (!course) notFound();

  const { data: enrollment } =
    await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("active", true)
      .single();

  if (!enrollment)
    redirect(
      `/cursos/${slug}?access=denied`
    );

  // Flatten lessons
  const allLessons =
    course.modules
      ?.sort(
        (a: any, b: any) =>
          a.order_index -
          b.order_index
      )
      .flatMap(
        (m: any) =>
          m.lessons
            ?.sort(
              (a: any, b: any) =>
                a.order_index -
                b.order_index
            )
            .map((l: any) => ({
              ...l,
              moduleTitle: m.title,
            })) || []
      ) || [];

  const currentLesson =
    allLessons.find(
      (l: any) =>
        l.id === lessonId
    ) || allLessons[0];

  const currentIndex =
    allLessons.findIndex(
      (l: any) =>
        l.id ===
        currentLesson?.id
    );

  const prevLesson =
    currentIndex > 0
      ? allLessons[currentIndex - 1]
      : null;

  const nextLesson =
    currentIndex <
    allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  const embedUrl = getEmbedUrl(
    currentLesson?.video_url || ""
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "var(--bg-base)",
      }}
    >
      {/* Top nav */}
      <nav className="glass border-b border-white/5 sticky top-0 z-50 flex-shrink-0">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-muted hover:text-white transition-colors text-sm"
            >
              ← Dashboard
            </Link>

            <span className="text-white/20">
              |
            </span>

            <span className="font-display font-semibold text-white text-sm truncate max-w-xs">
              {course.title}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted">
            <span>
              {currentIndex + 1} /{" "}
              {allLessons.length}{" "}
              lecciones
            </span>
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
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                    <span className="text-4xl">
                      ▶
                    </span>
                  </div>

                  <p className="text-muted text-sm">
                    Video no disponible
                  </p>
                </div>
              )}
            </div>

            {/* Lesson info */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-primary font-semibold mb-1 uppercase tracking-wide">
                  {
                    currentLesson?.moduleTitle
                  }
                </p>

                <h1 className="font-display text-2xl font-bold text-white">
                  {
                    currentLesson?.title
                  }
                </h1>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                {prevLesson && (
                  <Link
                    href={`/learn/${slug}/${prevLesson.id}`}
                    className="glass glass-hover text-sm text-muted px-4 py-2 rounded-xl border border-white/5 transition-all"
                  >
                    ← Anterior
                  </Link>
                )}

                {nextLesson && (
                  <Link
                    href={`/learn/${slug}/${nextLesson.id}`}
                    className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
                  >
                    Siguiente →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
