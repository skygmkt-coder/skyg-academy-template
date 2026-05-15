import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

function getEmbedUrl(url: string): string {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const id = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : "";
    }

    if (hostname.endsWith("youtube.com")) {
      const watchId = parsedUrl.searchParams.get("v");
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      const embeddedId = ["embed", "shorts", "live"].includes(pathParts[0]) ? pathParts[1] : null;
      const id = watchId || embeddedId;
      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : "";
    }

    if (hostname.endsWith("vimeo.com")) {
      const id = parsedUrl.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0` : "";
    }
  } catch {
    return url;
  }

  return url;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_super_admin, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = Boolean(profile?.is_admin || profile?.is_super_admin);

  // Get course with all modules and lessons. Admins can preview unpublished courses.
  const baseQuery = supabase
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
          resource_url,
          position,
          is_free_preview
        )
      )
    `)
    .eq("slug", slug);

  const finalQuery = isAdmin ? baseQuery : baseQuery.eq("published", true);
  const { data: course } = await finalQuery.maybeSingle();

  if (!course) notFound();

  if (!isAdmin) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle();

    if (!enrollment) redirect(`/cursos/${slug}?access=denied`);
  }

  // Sort modules and lessons
  const sortedModules = [...(course.modules || [])]
    .sort((a, b) => a.order_index - b.order_index)
    .map((m) => ({
      ...m,
      lessons: [...(m.lessons || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    }));

  const allLessons = sortedModules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id }))
  );

  if (allLessons.length === 0) redirect(`/cursos/${slug}`);

  const currentLesson = allLessons.find((l) => l.id === lessonId);
  if (!currentLesson) redirect(`/learn/${slug}/${allLessons[0].id}`);

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const progress = Math.round(((currentIndex + 1) / allLessons.length) * 100);

  const embedUrl = getEmbedUrl(currentLesson?.video_url || "");

  // Related courses (other published courses)
  const { data: relatedCourses } = await supabase
    .from("courses")
    .select("id, slug, title, description, price_cents")
    .eq("published", true)
    .neq("id", course.id)
    .limit(4);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base, #070B12)" }}>

      {/* ── TOP NAV ─────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(7,11,18,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        height: "52px", display: "flex", alignItems: "center",
        padding: "0 20px", gap: "16px",
      }}>
        <Link href="/dashboard"
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
          <Icons.chevronLeft size={16} />
          Dashboard
        </Link>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
        <span className="text-sm font-semibold text-white truncate flex-1">{course.title}</span>
        <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
          <span>{currentIndex + 1} / {allLessons.length}</span>
          <div style={{
            width: 80, height: 4,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 99, overflow: "hidden",
          }}>
            <div style={{
              width: `${progress}%`, height: "100%",
              background: "var(--color-primary, #3589F2)",
              borderRadius: 99, transition: "width 0.4s ease",
            }} />
          </div>
          <span style={{ color: "var(--color-primary, #3589F2)", fontWeight: 600 }}>{progress}%</span>
        </div>
      </nav>

      {/* ── MAIN LAYOUT ─────────────────────────── */}
      <div className="flex" style={{ minHeight: "calc(100vh - 52px)" }}>

        {/* ── LEFT: VIDEO + CONTENT ─────────────── */}
        <main className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px" }}>

            {/* Video player */}
            <div style={{
              aspectRatio: "16/9",
              background: "#000",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 24,
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}>
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: "none" }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4"
                  style={{ background: "rgba(13,20,33,1)" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "rgba(53,137,242,0.12)",
                    border: "2px solid rgba(53,137,242,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--color-primary, #3589F2)",
                  }}>
                    <Icons.play size={28} />
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                    Video no disponible
                  </p>
                </div>
              )}
            </div>

            {/* Lesson info */}
            <div style={{ marginBottom: 24 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: 6,
                color: "var(--color-primary, #3589F2)",
              }}>
                {currentLesson?.moduleTitle}
              </p>
              <h1 style={{
                fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800,
                color: "#fff", lineHeight: 1.2, marginBottom: 16,
                fontFamily: "var(--font-display, Sora, sans-serif)",
              }}>
                {currentLesson?.title}
              </h1>

              {/* Prev / Next */}
              <div style={{ display: "flex", gap: 10 }}>
                {prevLesson ? (
                  <Link href={`/learn/${slug}/${prevLesson.id}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.5)",
                      textDecoration: "none", transition: "all 0.2s",
                    }}>
                    <Icons.chevronLeft size={14} /> Anterior
                  </Link>
                ) : <div />}
                {nextLesson && (
                  <Link href={`/learn/${slug}/${nextLesson.id}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                      background: "var(--color-primary, #3589F2)",
                      color: "#fff", textDecoration: "none", transition: "all 0.2s",
                    }}>
                    Siguiente <Icons.chevronRight size={14} />
                  </Link>
                )}
              </div>
            </div>

            {/* Materials / Resources */}
            {currentLesson?.resource_url && (
              <div style={{
                marginBottom: 24, padding: "16px 20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
              }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", marginBottom: 10,
                  color: "rgba(255,255,255,0.4)",
                }}>
                  Material de apoyo
                </p>
                <a href={currentLesson.resource_url}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                    background: "rgba(53,137,242,0.1)",
                    border: "1px solid rgba(53,137,242,0.2)",
                    color: "var(--color-primary, #3589F2)",
                    textDecoration: "none",
                  }}>
                  <Icons.download size={16} />
                  Descargar recursos
                </a>
              </div>
            )}

            {/* Progress card */}
            <div style={{
              padding: "20px", marginBottom: 24,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Progreso del curso</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary, #3589F2)" }}>
                  {progress}%
                </span>
              </div>
              <div style={{
                height: 6, background: "rgba(255,255,255,0.06)",
                borderRadius: 99, overflow: "hidden",
              }}>
                <div style={{
                  width: `${progress}%`, height: "100%",
                  background: "linear-gradient(90deg, var(--color-primary, #3589F2), #0068C9)",
                  borderRadius: 99, transition: "width 0.5s ease",
                }} />
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>
                Lección {currentIndex + 1} de {allLessons.length} · {course.title}
              </p>
            </div>

            {/* Completion card (last lesson) */}
            {!nextLesson && (
              <div style={{
                padding: "32px", marginBottom: 32, textAlign: "center",
                background: "rgba(53,137,242,0.07)",
                border: "1px solid rgba(53,137,242,0.2)",
                borderRadius: 20,
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h3 style={{
                  fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8,
                  fontFamily: "var(--font-display, Sora, sans-serif)",
                }}>
                  ¡Completaste el curso!
                </h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
                  Has terminado todas las lecciones de {course.title}.
                </p>
                <button style={{
                  padding: "12px 32px", borderRadius: 99, fontSize: 14, fontWeight: 700,
                  background: "var(--color-primary, #3589F2)",
                  color: "#fff", border: "none", cursor: "pointer",
                }}>
                  Descargar certificado
                </button>
              </div>
            )}

            {/* Comments section */}
            <div style={{ marginBottom: 40 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 16,
              }}>
                <h2 style={{
                  fontSize: 16, fontWeight: 700, color: "#fff",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Icons.messageSquare size={18} />
                  Comentarios
                </h2>
                {isAdmin && (
                  <span style={{
                    fontSize: 11, padding: "4px 10px", borderRadius: 99,
                    background: "rgba(53,137,242,0.1)",
                    border: "1px solid rgba(53,137,242,0.2)",
                    color: "var(--color-primary, #3589F2)",
                    fontWeight: 600,
                  }}>
                    Admin: activo
                  </span>
                )}
              </div>
              <div style={{
                padding: "20px", borderRadius: 14,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
              }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
                  Los comentarios estarán disponibles próximamente.
                </p>
              </div>
            </div>

            {/* Related courses */}
            {relatedCourses && relatedCourses.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: 16, fontWeight: 700, color: "#fff",
                  marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Icons.explore size={18} />
                  Más cursos
                </h2>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 14,
                }}>
                  {relatedCourses.map((c) => (
                    <Link key={c.id} href={`/cursos/${c.slug}`}
                      style={{ textDecoration: "none" }}>
                      <div style={{
                        borderRadius: 14, overflow: "hidden",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        transition: "all 0.2s",
                        cursor: "pointer",
                      }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(53,137,242,0.3)";
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                        }}
                      >
                        <div style={{
                          aspectRatio: "16/9",
                          background: "linear-gradient(135deg, rgba(53,137,242,0.15), rgba(13,20,33,1))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "rgba(255,255,255,0.2)",
                        }}>
                          <Icons.play size={24} />
                        </div>
                        <div style={{ padding: "12px 14px" }}>
                          <p style={{
                            fontSize: 12, fontWeight: 600, color: "#fff",
                            marginBottom: 6, lineHeight: 1.3,
                          }}>
                            {c.title}
                          </p>
                          <p style={{
                            fontSize: 13, fontWeight: 700,
                            color: "var(--color-primary, #3589F2)",
                          }}>
                            ${(c.price_cents / 100).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT: CURRICULUM SIDEBAR ──────────── */}
        <aside style={{
          width: 320, flexShrink: 0,
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          overflowY: "auto",
          position: "sticky", top: 52,
          height: "calc(100vh - 52px)",
          background: "rgba(7,11,18,0.6)",
          display: "none",
        }}
          className="lg:block"
        >
          <div style={{ padding: "16px 12px" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingBottom: 12, marginBottom: 4,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                Contenido del curso
              </h3>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {allLessons.length} lecciones
              </span>
            </div>

            {sortedModules.map((module) => (
              <div key={module.id} style={{ marginBottom: 4 }}>
                {/* Module header */}
                <div style={{
                  padding: "10px 8px 6px",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                }}>
                  {module.title}
                </div>

                {/* Lessons */}
                {module.lessons.map((lesson) => {
                  const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id);
                  const isActive = lesson.id === currentLesson?.id;
                  const isDone = lessonIndex < currentIndex;

                  return (
                    <Link
                      key={lesson.id}
                      href={`/learn/${slug}/${lesson.id}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", borderRadius: 10, marginBottom: 2,
                        textDecoration: "none", transition: "all 0.15s",
                        background: isActive
                          ? "rgba(53,137,242,0.12)"
                          : "transparent",
                        border: isActive
                          ? "1px solid rgba(53,137,242,0.2)"
                          : "1px solid transparent",
                      }}
                    >
                      {/* Status circle */}
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        flexShrink: 0, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700,
                        background: isActive
                          ? "var(--color-primary, #3589F2)"
                          : isDone
                            ? "rgba(22,163,74,0.2)"
                            : "rgba(255,255,255,0.05)",
                        border: isActive
                          ? "none"
                          : isDone
                            ? "1px solid rgba(22,163,74,0.4)"
                            : "1px solid rgba(255,255,255,0.1)",
                        color: isActive
                          ? "#fff"
                          : isDone
                            ? "#4ade80"
                            : "rgba(255,255,255,0.3)",
                      }}>
                        {isDone ? <Icons.check size={12} /> : isActive ? <Icons.play size={10} /> : lessonIndex + 1}
                      </div>

                      {/* Title */}
                      <span style={{
                        fontSize: 12, lineHeight: 1.3,
                        color: isActive
                          ? "#fff"
                          : isDone
                            ? "rgba(255,255,255,0.5)"
                            : "rgba(255,255,255,0.4)",
                        fontWeight: isActive ? 600 : 400,
                        flex: 1,
                      }}>
                        {lesson.title}
                      </span>

                      {/* Resource indicator */}
                      {lesson.resource_url && (
                        <Icons.file size={12} />
                      )}
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
