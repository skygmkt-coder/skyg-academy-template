import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

function getEmbedUrl(url: string): string {
  if (!url) return "";

  if (
    url.includes("youtube.com") ||
    url.includes("youtu.be")
  ) {
    const id = url.includes("v=")
      ? url.split("v=")[1]?.split("&")[0]
      : url.split("/").pop();

    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
  }

  if (url.includes("vimeo.com")) {
    const id = url.split("/").pop();

    return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`;
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
  const { slug, lessonId } =
    await params;

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: course } =
    await supabase
      .from("courses")
      .select(`
        id,
        title,
        slug,
        description,
        price_cents,
        modules (
          id,
          title,
          order_index,
          lessons (
            id,
            title,
            video_url,
            position,
            is_free_preview
          )
        )
      `)
      .eq("slug", slug)
      .single();

  if (!course) {
    notFound();
  }

  const {
    data: enrollment,
  } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("active", true)
    .single();

  if (!enrollment) {
    redirect(
      `/cursos/${slug}?access=denied`
    );
  }

  const {
    data: profile,
  } = await supabase
    .from("profiles")
    .select(`
      is_admin,
      is_super_admin,
      full_name
    `)
    .eq("id", user.id)
    .single();

  const isAdmin =
    profile?.is_admin ||
    profile?.is_super_admin;

  const sortedModules = [
    ...(course.modules || []),
  ]
    .sort(
      (a, b) =>
        (a.order_index ?? 0) -
        (b.order_index ?? 0)
    )
    .map((m) => ({
      ...m,

      lessons: [
        ...(m.lessons || []),
      ].sort(
        (a, b) =>
          (a.position ?? 0) -
          (b.position ?? 0)
      ),
    }));

  const allLessons =
    sortedModules.flatMap((m) =>
      m.lessons.map((l) => ({
        ...l,
        moduleTitle: m.title,
        moduleId: m.id,
      }))
    );

  const currentLesson =
    allLessons.find(
      (l) => l.id === lessonId
    ) || allLessons[0];

  const currentIndex =
    allLessons.findIndex(
      (l) =>
        l.id === currentLesson?.id
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

  const progress = Math.round(
    ((currentIndex + 1) /
      allLessons.length) *
      100
  );

  const embedUrl = getEmbedUrl(
    currentLesson?.video_url || ""
  );

  const {
    data: relatedCourses,
  } = await supabase
    .from("courses")
    .select(`
      id,
      slug,
      title,
      description,
      price_cents
    `)
    .eq("published", true)
    .neq("id", course.id)
    .limit(4);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "var(--bg-base, #070B12)",
      }}
    >
      <div
        className="flex"
        style={{
          minHeight: "100vh",
        }}
      >
        <main className="flex-1 overflow-y-auto">
          <div
            style={{
              maxWidth: 900,
              margin: "0 auto",
              padding:
                "24px 20px 60px",
            }}
          >
            <div
              style={{
                aspectRatio: "16/9",
                background: "#000",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 24,
              }}
            >
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allowFullScreen
                  style={{
                    border: "none",
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40">
                  Video no disponible
                </div>
              )}
            </div>

            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 16,
              }}
            >
              {currentLesson?.title}
            </h1>

            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 32,
              }}
            >
              {prevLesson && (
                <Link
                  href={`/learn/${slug}/${prevLesson.id}`}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/60"
                >
                  Anterior
                </Link>
              )}

              {nextLesson && (
                <Link
                  href={`/learn/${slug}/${nextLesson.id}`}
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white"
                >
                  Siguiente
                </Link>
              )}
            </div>

            <div
              style={{
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  height: 8,
                  background:
                    "rgba(255,255,255,0.08)",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background:
                      "#3589F2",
                  }}
                />
              </div>

              <p
                style={{
                  marginTop: 8,
                  color:
                    "rgba(255,255,255,0.4)",
                  fontSize: 12,
                }}
              >
                {progress}% completado
              </p>
            </div>

            {relatedCourses &&
              relatedCourses.length >
                0 && (
                <div>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: 16,
                    }}
                  >
                    Más cursos
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedCourses.map(
                      (c) => (
                        <Link
                          key={c.id}
                          href={`/cursos/${c.slug}`}
                          className="p-4 rounded-2xl border border-white/10 bg-white/5"
                        >
                          <h3 className="text-white font-semibold mb-2">
                            {c.title}
                          </h3>

                          <p className="text-white/40 text-sm">
                            $
                            {(
                              c.price_cents /
                              100
                            ).toLocaleString()}
                          </p>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        </main>

        <aside className="hidden lg:block w-[320px] border-l border-white/10">
          <div className="p-4">
            <h3 className="text-white font-bold mb-4">
              Contenido del curso
            </h3>

            {sortedModules.map(
              (module) => (
                <div
                  key={module.id}
                  className="mb-4"
                >
                  <p className="text-xs uppercase text-white/30 mb-2">
                    {module.title}
                  </p>

                  {module.lessons.map(
                    (lesson) => {
                      const isActive =
                        lesson.id ===
                        currentLesson?.id;

                      return (
                        <Link
                          key={lesson.id}
                          href={`/learn/${slug}/${lesson.id}`}
                          className={`block px-3 py-2 rounded-xl mb-1 ${
                            isActive
                              ? "bg-blue-500/20 text-white"
                              : "text-white/50 hover:bg-white/5"
                          }`}
                        >
                          {
                            lesson.title
                          }
                        </Link>
                      );
                    }
                  )}
                </div>
              )
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
