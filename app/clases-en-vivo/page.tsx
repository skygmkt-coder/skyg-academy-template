import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

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

function formatDate(d: string) {
  return new Date(d).toLocaleString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeUntil(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  if (diff < 0) return null;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Empieza en ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Empieza en ${h}h`;
  const days = Math.floor(h / 24);
  return `Empieza en ${days} día${days > 1 ? "s" : ""}`;
}

export default async function ClasesEnVivoPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: { user } } = await supabase.auth.getUser();

  // Get upcoming public classes + classes from enrolled courses
  const { data: upcoming } = await supabase
    .from("live_classes")
    .select("*, courses(id, title, slug)")
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true });

  // Filter: public ones, or ones linked to courses the user is enrolled in
  let enrolledCourseIds: string[] = [];
  if (user) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("active", true);
    enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
  }

  const visibleClasses = upcoming?.filter(c =>
    c.is_public || (c.courses && enrolledCourseIds.includes(c.courses.id))
  ) || [];

  // Past classes with recordings
  const { data: recordings } = await supabase
    .from("live_classes")
    .select("*, courses(id, title, slug)")
    .lt("scheduled_at", now)
    .not("recording_url", "is", null)
    .order("scheduled_at", { ascending: false })
    .limit(10);

  const visibleRecordings = recordings?.filter(c =>
    c.is_public || (c.courses && enrolledCourseIds.includes(c.courses.id))
  ) || [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base, #070B12)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary, #3589F2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            En vivo
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--font-display, Sora, sans-serif)" }}>
            Clases en vivo
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Sesiones en tiempo real con tu instructor
          </p>
        </div>

        {/* Upcoming */}
        {visibleClasses.length > 0 ? (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 16px 0" }}>
              Próximas sesiones
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {visibleClasses.map(cls => {
                const until = timeUntil(cls.scheduled_at);
                const isLive = Math.abs(Date.now() - new Date(cls.scheduled_at).getTime()) < 1000 * 60 * 30;
                return (
                  <div key={cls.id}
                    style={{
                      background: isLive ? "rgba(53,137,242,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isLive ? "rgba(53,137,242,0.3)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 16,
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                    }}>
                    {/* Icon */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                      background: isLive ? "rgba(53,137,242,0.15)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${isLive ? "rgba(53,137,242,0.3)" : "rgba(255,255,255,0.08)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isLive ? "var(--color-primary, #3589F2)" : "rgba(255,255,255,0.3)",
                    }}>
                      <Icons.video size={22} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isLive && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulse 1s ease infinite" }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", letterSpacing: "0.06em" }}>EN VIVO AHORA</span>
                        </div>
                      )}
                      <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 4px 0" }}>{cls.title}</p>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 6px 0" }}>
                        {formatDate(cls.scheduled_at)} · {cls.duration_minutes || 60} min
                      </p>
                      {cls.courses && (
                        <p style={{ fontSize: 12, color: "var(--color-primary, #3589F2)", margin: 0 }}>
                          {cls.courses.title}
                        </p>
                      )}
                      {cls.description && (
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
                          {cls.description}
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <div style={{ flexShrink: 0 }}>
                      {cls.zoom_url ? (
                        <a href={cls.zoom_url} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                            background: isLive ? "var(--color-primary, #3589F2)" : "rgba(53,137,242,0.12)",
                            color: isLive ? "#fff" : "var(--color-primary, #3589F2)",
                            border: `1px solid ${isLive ? "transparent" : "rgba(53,137,242,0.25)"}`,
                            textDecoration: "none",
                          }}>
                          <Icons.video size={16} />
                          {isLive ? "Unirse ahora" : "Unirse a Zoom"}
                        </a>
                      ) : (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "10px 16px" }}>
                          {until || "Próximamente"}
                        </div>
                      )}
                      {until && !isLive && (
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 6 }}>
                          {until}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, marginBottom: 48,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 8px 0" }}>No hay clases próximas</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Cuando el instructor programe una sesión en vivo, aparecerá aquí.
            </p>
          </div>
        )}

        {/* Recordings */}
        {visibleRecordings.length > 0 && (
          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 16px 0" }}>
              Grabaciones anteriores
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibleRecordings.map(cls => (
                <div key={cls.id}
                  style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 14, padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: 16, opacity: 0.7,
                  }}>
                  <div style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
                    <Icons.play size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: "0 0 2px 0" }}>{cls.title}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                      {new Date(cls.scheduled_at).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <a href={cls.recording_url} target="_blank" rel="noopener noreferrer"
                    style={{
                      fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.5)", textDecoration: "none",
                      display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                    }}>
                    <Icons.play size={12} />
                    Ver grabación
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
