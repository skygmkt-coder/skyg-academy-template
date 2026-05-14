import { redirect } from "next/navigation";
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
        getAll() { return cookieStore.getAll(); },
        setAll(c: any[]) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
      },
    }
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: enrollments }, { data: catalog }, { data: upcomingClasses }] = await Promise.all([
    supabase.from("profiles").select("full_name, is_admin, is_super_admin").eq("id", user.id).single(),
    supabase.from("enrollments")
      .select("enrolled_at, courses(id, slug, title, level, duration_minutes, thumbnail_url)")
      .eq("user_id", user.id).eq("active", true)
      .order("enrolled_at", { ascending: false }),
    supabase.from("courses")
      .select("id, slug, title, price_cents, level, duration_minutes, thumbnail_url")
      .eq("published", true).eq("show_in_landing", true)
      .order("created_at", { ascending: false }).limit(8),
    supabase.from("live_classes")
      .select("id, title, scheduled_at, is_public")
      .gte("scheduled_at", new Date().toISOString()).eq("is_public", true)
      .order("scheduled_at", { ascending: true }).limit(1),
  ]);

  const firstName = (profile?.full_name || user.email || "").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días ☀️" : hour < 18 ? "Buenas tardes 👋" : "Buenas noches 🌙";
  const enrolledIds = new Set((enrollments || []).map((e: any) => e.courses?.id).filter(Boolean));
  const filteredCatalog = (catalog || []).filter(c => !enrolledIds.has(c.id));

  const S = {
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" as const, transition: "all 0.2s" },
    thumb: (url?: string) => ({
      aspectRatio: "16/9",
      background: url ? `url(${url}) center/cover` : "linear-gradient(135deg,rgba(53,137,242,0.18),rgba(13,20,33,1))",
      display: "flex", alignItems: "center", justifyContent: "center",
    }),
    body: { padding: "12px 14px" },
    title: { fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 10px 0", lineHeight: 1.3 },
    meta: { fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 4px 0" },
    price: { fontSize: 14, fontWeight: 800, color: "#fff" },
    link: { fontSize: 11, padding: "5px 12px", borderRadius: 8, background: "rgba(53,137,242,0.1)", border: "1px solid rgba(53,137,242,0.25)", color: "var(--color-primary,#3589F2)", textDecoration: "none" as const },
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base,#070B12)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>

        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 3px 0" }}>{greeting}</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "var(--font-display,Sora,sans-serif)" }}>
            Hola, {firstName}
          </h1>
        </div>

        {/* Live class alert */}
        {upcomingClasses && upcomingClasses.length > 0 && (
          <Link href="/clases-en-vivo" style={{ textDecoration: "none", display: "block", marginBottom: 20 }}>
            <div style={{ padding: "12px 18px", borderRadius: 12, background: "rgba(53,137,242,0.07)", border: "1px solid rgba(53,137,242,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: "pulse 1s ease infinite" }} />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0 }}>
                <strong style={{ color: "#fff" }}>Próxima clase en vivo:</strong> {upcomingClasses[0].title} ·{" "}
                {new Date(upcomingClasses[0].scheduled_at).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                <span style={{ color: "var(--color-primary,#3589F2)", marginLeft: 6 }}>Ver →</span>
              </p>
            </div>
          </Link>
        )}

        {/* My courses */}
        {enrollments && enrollments.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 14px 0" }}>Mis cursos</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
              {enrollments.map(({ courses: c }: any) => c && (
                <Link key={c.id} href={`/learn/${c.slug}`} style={{ textDecoration: "none" }}>
                  <div style={S.card}>
                    <div style={S.thumb(c.thumbnail_url)}>
                      {!c.thumbnail_url && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 22 }}>▶</span>}
                      <span style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 5 }}>
                        Continuar →
                      </span>
                    </div>
                    <div style={S.body}>
                      <p style={S.title}>{c.title}</p>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 99 }}>
                        <div style={{ width: "0%", height: "100%", background: "var(--color-primary,#3589F2)", borderRadius: 99 }} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {(!enrollments || enrollments.length === 0) && (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, marginBottom: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🎓</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 5px 0" }}>Aún no tienes cursos</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 16px 0" }}>Explora el catálogo y empieza hoy</p>
            <Link href="#catalogo" style={{ padding: "9px 22px", borderRadius: 99, fontSize: 13, fontWeight: 600, background: "var(--color-primary,#3589F2)", color: "#fff", textDecoration: "none" }}>
              Ver cursos disponibles →
            </Link>
          </div>
        )}

        {/* Catalog */}
        <section id="catalogo">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Explorar catálogo</h2>
            <Link href="/tienda" style={{ fontSize: 12, color: "var(--color-primary,#3589F2)", textDecoration: "none" }}>Tienda →</Link>
          </div>

          {filteredCatalog.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
              {filteredCatalog.map(course => (
                <div key={course.id} style={S.card}>
                  <div style={S.thumb(course.thumbnail_url)}>
                    {!course.thumbnail_url && <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 22 }}>▶</span>}
                  </div>
                  <div style={S.body}>
                    <p style={S.meta}>{course.level || "Curso"}{course.duration_minutes ? ` · ${Math.round(course.duration_minutes / 60)}h` : ""}</p>
                    <p style={S.title}>{course.title}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={S.price}>${(course.price_cents / 100).toLocaleString()}</span>
                      <Link href={`/cursos/${course.slug}`} style={S.link}>Ver curso</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "32px", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                No hay cursos publicados aún.
                {(profile?.is_admin || profile?.is_super_admin) && (
                  <> <Link href="/admin/cursos/nuevo" style={{ color: "var(--color-primary,#3589F2)" }}>Crear el primero →</Link></>
                )}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
