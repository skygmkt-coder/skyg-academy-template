import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CheckoutButton from "@/components/course/CheckoutButton";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    access?: string;
    preview?: string;
  }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ─────────────────────────────────────────────
  // ADMIN CHECK
  // ─────────────────────────────────────────────

  let isAdmin = false;

  if (user) {
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "is_admin, is_super_admin"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (
      !profileError &&
      profile
    ) {
      isAdmin = !!(
        profile.is_admin ||
        profile.is_super_admin
      );
    }
  }

  // ─────────────────────────────────────────────
  // COURSE QUERY
  // ─────────────────────────────────────────────

  const query = supabase
    .from("courses")
    .select(`
      *,
      modules (
        id,
        title,
        order_index,
        lessons (
          id,
          title,
          position,
          is_free_preview
        )
      )
    `)
    .eq("slug", slug);

  if (!isAdmin) {
    query.eq("published", true);
  }

  const {
    data: course,
    error: courseError,
  } = await query.single();

  if (courseError) {
    return (
      <pre>
        {JSON.stringify(
          courseError,
          null,
          2
        )}
      </pre>
    );
  }

  if (!course) {
    notFound();
  }

  // ─────────────────────────────────────────────
  // SORTING
  // ─────────────────────────────────────────────

  const normalizedCourse = {
    ...course,

    modules: [
      ...(course.modules || []),
    ]
      .map((module: any) => ({
        ...module,

        order_index:
          module.order_index ?? 0,

        lessons: [
          ...(module.lessons ||
            []),
        ]
          .map((lesson: any) => ({
            ...lesson,

            order_index:
              lesson.position ?? 0,
          }))
          .sort(
            (
              a: any,
              b: any
            ) =>
              a.order_index -
              b.order_index
          ),
      }))
      .sort(
        (a: any, b: any) =>
          a.order_index -
          b.order_index
      ),
  };

  // ─────────────────────────────────────────────
  // ACCESS CHECK
  // ─────────────────────────────────────────────

  const allLessons =
    normalizedCourse.modules?.flatMap(
      (m: any) =>
        m.lessons || []
    ) || [];

  let hasAccess = isAdmin;

  if (user && !isAdmin) {
    const { data: enroll } =
      await supabase
        .from("enrollments")
        .select("id")
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "course_id",
          normalizedCourse.id
        )
        .eq("active", true)
        .single();

    hasAccess = !!enroll;
  }

  const price =
    normalizedCourse.price_cents /
    100;

  const isFree = price === 0;

  const totalModules =
    normalizedCourse.modules
      ?.length || 0;

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "var(--bg-base,#070B12)",
      }}
    >
      {/* ADMIN PREVIEW */}
      {isAdmin &&
        !normalizedCourse.published && (
          <div
            style={{
              background:
                "rgba(245,158,11,0.1)",
              borderBottom:
                "1px solid rgba(245,158,11,0.2)",
              padding:
                "10px 24px",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "#fbbf24",
              }}
            >
              👁 Vista previa —
              Este curso{" "}
              <strong>
                no está publicado
              </strong>
              .
            </span>

            <a
              href={`/admin/cursos/${normalizedCourse.id}`}
              style={{
                fontSize: 12,
                color: "#fbbf24",
                fontWeight: 600,
              }}
            >
              Ir al editor →
            </a>
          </div>
        )}

      {/* ACCESS DENIED */}
      {sp.access ===
        "denied" && (
        <div
          style={{
            background:
              "rgba(232,0,74,0.08)",
            borderBottom:
              "1px solid rgba(232,0,74,0.15)",
            padding:
              "10px 24px",
            fontSize: 13,
            color:
              "var(--color-accent,#E8004A)",
          }}
        >
          Necesitas acceso a
          este curso.
        </div>
      )}

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding:
            "48px 24px 80px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 340px",
            gap: 48,
          }}
        >
          {/* LEFT */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <Link
                href="/#cursos"
                style={{
                  fontSize: 13,
                  color:
                    "rgba(255,255,255,0.4)",
                  textDecoration:
                    "none",
                }}
              >
                Cursos
              </Link>

              <span
                style={{
                  color:
                    "rgba(255,255,255,0.2)",
                }}
              >
                ›
              </span>

              <span
                style={{
                  fontSize: 13,
                  color:
                    "rgba(255,255,255,0.6)",
                }}
              >
                {
                  normalizedCourse.title
                }
              </span>
            </div>

            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color:
                  "var(--color-primary,#3589F2)",
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.08em",
                marginBottom: 10,
              }}
            >
              {totalModules} módulos
              ·{" "}
              {
                allLessons.length
              }{" "}
              lecciones
            </p>

            <h1
              style={{
                fontSize:
                  "clamp(26px,4vw,40px)",
                fontWeight: 800,
                color: "#fff",
                margin:
                  "0 0 16px 0",
              }}
            >
              {
                normalizedCourse.title
              }
            </h1>

            {normalizedCourse.description && (
              <p
                style={{
                  fontSize: 16,
                  color:
                    "rgba(255,255,255,0.5)",
                  lineHeight: 1.7,
                  marginBottom: 36,
                }}
              >
                {
                  normalizedCourse.description
                }
              </p>
            )}

            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                margin:
                  "0 0 16px 0",
              }}
            >
              Contenido del
              curso
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: 8,
              }}
            >
              {normalizedCourse.modules?.map(
                (
                  module: any
                ) => (
                  <div
                    key={
                      module.id
                    }
                    style={{
                      background:
                        "rgba(255,255,255,0.03)",
                      border:
                        "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 14,
                      overflow:
                        "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding:
                          "12px 18px",
                        borderBottom:
                          "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color:
                            "#fff",
                          margin: 0,
                        }}
                      >
                        {
                          module.title
                        }
                      </h3>
                    </div>

                    {module.lessons?.map(
                      (
                        lesson: any,
                        i: number
                      ) => (
                        <div
                          key={
                            lesson.id
                          }
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            padding:
                              "10px 18px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              color:
                                "rgba(255,255,255,0.6)",
                            }}
                          >
                            {i + 1}.{" "}
                            {
                              lesson.title
                            }
                          </span>

                          {!lesson.is_free_preview &&
                            !hasAccess && (
                              <span>
                                🔒
                              </span>
                            )}
                        </div>
                      )
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div
              style={{
                position:
                  "sticky",
                top: 24,
                background:
                  "rgba(13,20,33,0.9)",
                border:
                  "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                overflow:
                  "hidden",
              }}
            >
              <div
                style={{
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#fff",
                    marginBottom: 4,
                  }}
                >
                  {isFree
                    ? "Gratis"
                    : `$${price.toLocaleString()}`}
                </div>

                {hasAccess ? (
                  <Link
                    href={`/learn/${normalizedCourse.slug}`}
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      textAlign:
                        "center",
                      padding:
                        "14px 0",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      background:
                        "var(--color-primary,#3589F2)",
                      color: "#fff",
                      textDecoration:
                        "none",
                    }}
                  >
                    Ir al curso →
                  </Link>
                ) : (
                  <CheckoutButton
                    courseId={
                      normalizedCourse.id
                    }
                    price={
                      price
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
