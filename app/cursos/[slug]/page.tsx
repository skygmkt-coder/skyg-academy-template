import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CheckoutButton from "@/components/course/CheckoutButton";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string; preview?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is admin (can preview unpublished)
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("is_admin, is_super_admin").eq("id", user.id).single();
    isAdmin = !!(profile?.is_admin || profile?.is_super_admin);
  }

  // Admins can see unpublished courses, others only published
  const query = supabase
    .from("courses")
    .select("*, modules(*, lessons(id, title, is_free_preview, order_index))")
    .eq("slug", slug);

  if (!isAdmin) query.eq("published", true);

  const { data: course } = await query.single();
  if (!course) notFound();

  const allLessons = course.modules?.flatMap((m: any) => m.lessons || []) || [];

  let hasAccess = isAdmin; // admins always have access for preview
  if (user && !isAdmin) {
    const { data: enroll } = await supabase
      .from("enrollments").select("id")
      .eq("user_id", user.id).eq("course_id", course.id).eq("active", true).single();
    hasAccess = !!enroll;
  }

  const price = course.price_cents / 100;
  const isFree = price === 0;
  const totalModules = course.modules?.length || 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base,#070B12)" }}>

      {/* Admin preview banner */}
      {isAdmin && !course.published && (
        <div style={{ background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.2)", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#fbbf24" }}>
            👁 Vista previa — Este curso <strong>no está publicado</strong> todavía. Solo tú puedes verlo.
          </span>
          <a href={`/admin/cursos/${course.id}`} style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>
            Ir al editor →
          </a>
        </div>
      )}

      {/* Access denied */}
      {sp.access === "denied" && (
        <div style={{ background: "rgba(232,0,74,0.08)", borderBottom: "1px solid rgba(232,0,74,0.15)", padding: "10px 24px", fontSize: 13, color: "var(--color-accent,#E8004A)" }}>
          Necesitas acceso a este curso para ver el contenido.
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 48 }}>

          {/* ── LEFT ─────────────────────────────── */}
          <div>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Link href="/#cursos" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Cursos</Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{course.title}</span>
            </div>

            {/* Meta */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary,#3589F2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              {totalModules} módulos · {allLessons.length} lecciones
              {course.level && ` · ${course.level}`}
              {course.duration_minutes && ` · ${Math.round(course.duration_minutes / 60)}h`}
            </p>

            <h1 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, color: "#fff", margin: "0 0 16px 0", fontFamily: "var(--font-display,Sora,sans-serif)", lineHeight: 1.15 }}>
              {course.title}
            </h1>

            {course.description && (
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 36 }}>
                {course.description}
              </p>
            )}

            {/* Promo video */}
            {course.promo_video_url && (() => {
              const url = course.promo_video_url;
              let embed = "";
              if (url.includes("youtube.com") || url.includes("youtu.be")) {
                const id = url.includes("v=") ? url.split("v=")[1]?.split("&")[0] : url.split("/").pop();
                embed = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
              } else if (url.includes("vimeo.com")) {
                embed = `https://player.vimeo.com/video/${url.split("/").pop()}?title=0`;
              }
              if (!embed) return null;
              return (
                <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "16/9", marginBottom: 36, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                  <iframe src={embed} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen" allowFullScreen />
                </div>
              );
            })()}

            {/* Cover image fallback if no video */}
            {!course.promo_video_url && course.thumbnail_url && (
              <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "16/9", marginBottom: 36, background: `url(${course.thumbnail_url}) center/cover`, border: "1px solid rgba(255,255,255,0.08)" }} />
            )}

            {/* Curriculum */}
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 16px 0" }}>Contenido del curso</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {course.modules
                ?.sort((a: any, b: any) => a.order_index - b.order_index)
                .map((module: any) => (
                  <div key={module.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>{module.title}</h3>
                    </div>
                    {module.lessons
                      ?.sort((a: any, b: any) => a.order_index - b.order_index)
                      .map((lesson: any, i: number) => (
                        <div key={lesson.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>
                              {i + 1}
                            </span>
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{lesson.title}</span>
                          </div>
                          {lesson.is_free_preview && !hasAccess && (
                            <span style={{ fontSize: 10, color: "var(--color-primary,#3589F2)", border: "1px solid rgba(53,137,242,0.3)", padding: "2px 8px", borderRadius: 99 }}>
                              Gratis
                            </span>
                          )}
                          {!lesson.is_free_preview && !hasAccess && (
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>🔒</span>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          </div>

          {/* ── RIGHT: Sticky card ───────────────── */}
          <div>
            <div style={{ position: "sticky", top: 24, background: "rgba(13,20,33,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

              {/* Thumbnail */}
              <div style={{
                aspectRatio: "16/9",
                background: course.thumbnail_url
                  ? `url(${course.thumbnail_url}) center/cover`
                  : "linear-gradient(135deg,rgba(53,137,242,0.2),rgba(13,20,33,1))",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {!course.thumbnail_url && <span style={{ fontSize: 36, color: "rgba(255,255,255,0.2)" }}>▶</span>}
              </div>

              <div style={{ padding: "24px" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "var(--font-display,Sora,sans-serif)", marginBottom: 4 }}>
                  {isFree ? "Gratis" : `$${price.toLocaleString()}`}
                  {!isFree && <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>MXN</span>}
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
                  Acceso de por vida · Certificado incluido
                </p>

                {hasAccess ? (
                  <Link href={`/learn/${course.slug}`}
                    style={{ display: "block", width: "100%", textAlign: "center", padding: "14px 0", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "var(--color-primary,#3589F2)", color: "#fff", textDecoration: "none" }}>
                    Ir al curso →
                  </Link>
                ) : (
                  <CheckoutButton courseId={course.id} price={price} />
                )}

                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Acceso de por vida", "Actualizaciones gratuitas", "Certificado digital", "30 días de garantía"].map(b => (
                    <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                      <span style={{ color: "var(--color-primary,#3589F2)" }}>✓</span> {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}