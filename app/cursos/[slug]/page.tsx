import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import CheckoutButton from "@/components/course/CheckoutButton";

function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { slug } = resolvedParams;

  const supabase = createClient();

  const { data: course } = await supabase
    .from("courses")
    .select(
      "*, modules(*, lessons(id,title,is_free_preview,order_index))"
    )
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!course) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allLessons =
    course.modules?.flatMap((m: any) => m.lessons || []) || [];

  let hasAccess = false;

  if (user) {
    const { data: enroll } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("active", true)
      .single();

    hasAccess = !!enroll;
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)" }}
    >
      <nav className="glass border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-display font-bold text-lg"
          >
            <span className="text-primary">SKYG</span>
            <span className="text-white"> Academy</span>
          </Link>

          {user ? (
            <Link
              href="/dashboard"
              className="text-sm text-muted hover:text-white transition-colors"
            >
              ← Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-primary text-white px-5 py-2 rounded-full font-medium"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-10">
        {/* Left */}
        <div className="lg:col-span-2">
          {resolvedSearchParams.access === "denied" && (
            <div className="mb-6 glass border border-accent/20 rounded-xl p-4 text-sm text-accent">
              Necesitas comprar este curso para acceder al contenido.
            </div>
          )}

          <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">
            {course.modules?.length} módulos ·{" "}
            {allLessons.length} lecciones
          </p>

          <h1 className="font-display text-4xl font-bold text-white mb-4">
            {course.title}
          </h1>

          <p className="text-muted text-lg leading-relaxed mb-8">
            {course.description}
          </p>

          {/* Modules list */}
          <h2 className="font-display text-xl font-semibold text-white mb-4">
            Contenido del curso
          </h2>

          <div className="space-y-3">
            {course.modules
              ?.sort(
                (a: any, b: any) =>
                  a.order_index - b.order_index
              )
              .map((module: any) => (
                <div
                  key={module.id}
                  className="glass rounded-2xl overflow-hidden border border-white/5"
                >
                  <div className="px-5 py-4 border-b border-white/5">
                    <h3 className="font-semibold text-white text-sm">
                      {module.title}
                    </h3>
                  </div>

                  {module.lessons
                    ?.sort(
                      (a: any, b: any) =>
                        a.order_index - b.order_index
                    )
                    .map((lesson: any, i: number) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-muted">
                            {i + 1}
                          </span>

                          <span className="text-sm text-muted">
                            {lesson.title}
                          </span>
                        </div>

                        {lesson.is_free_preview &&
                          !hasAccess && (
                            <span className="text-xs text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                              Gratis
                            </span>
                          )}

                        {!lesson.is_free_preview &&
                          !hasAccess && (
                            <span className="text-xs text-muted/40">
                              🔒
                            </span>
                          )}
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 glass rounded-2xl border border-white/10 shadow-card overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-primary/20 via-surface to-accent/5 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-3xl">
                ▶
              </div>
            </div>

            <div className="p-6">
              <div className="font-display text-4xl font-bold text-white mb-1">
                $
                {(course.price_cents / 100).toLocaleString()}
              </div>

              <p className="text-xs text-muted mb-6">
                Acceso de por vida · Certificado incluido
              </p>

              {hasAccess ? (
                <Link
                  href={`/learn/${course.slug}`}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-xl transition-all hover:shadow-glow"
                >
                  Ir al curso →
                </Link>
              ) : (
                <CheckoutButton
                  courseId={course.id}
                  price={course.price_cents / 100}
                />
              )}

              <div className="mt-6 space-y-2.5 text-sm text-muted">
                {[
                  "Acceso de por vida",
                  "Actualizaciones gratuitas",
                  "Certificado digital",
                  "30 días de garantía",
                ].map((b) => (
                  <div
                    key={b}
                    className="flex items-center gap-2"
                  >
                    <span className="text-primary">✓</span>
                    {b}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
