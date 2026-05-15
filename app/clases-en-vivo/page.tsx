import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function fmt(d: string) {
  return new Date(d).toLocaleString("es-MX", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
}

function until(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  if (diff <= 0) return null;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `En ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `En ${h}h`;
  return `En ${Math.floor(h / 24)} días`;
}

export default async function ClasesEnVivoPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: upcoming } = await supabase
    .from("live_classes").select("*, courses(id,title,slug)")
    .gte("scheduled_at", now).order("scheduled_at", { ascending: true });

  let enrolledIds: string[] = [];
  if (user) {
    const { data: e } = await supabase.from("enrollments")
      .select("course_id").eq("user_id", user.id).eq("active", true);
    enrolledIds = e?.map(x => x.course_id) || [];
  }

  const visible = upcoming?.filter(c => c.is_public || (c.courses && enrolledIds.includes(c.courses.id))) || [];

  const { data: past } = await supabase.from("live_classes")
    .select("*, courses(id,title,slug)").lt("scheduled_at", now)
    .order("scheduled_at", { ascending: false }).limit(10);
  const visiblePast = past?.filter(c => c.is_public || (c.courses && enrolledIds.includes(c.courses.id))) || [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base,#070B12)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary,#3589F2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>En vivo</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--font-display,Sora,sans-serif)" }}>Clases en vivo</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>Sesiones en tiempo real con tu instructor</p>
        </div>

        {visible.length > 0 ? (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 16px 0" }}>Próximas sesiones</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {visible.map(cls => {
                const u = until(cls.scheduled_at);
                const isLive = Math.abs(Date.now() - new Date(cls.scheduled_at).getTime()) < 30 * 60 * 1000;
                return (
                  <Link key={cls.id} href={`/clases-en-vivo/${cls.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      background: isLive ? "rgba(53,137,242,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isLive ? "rgba(53,137,242,0.3)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 16, padding: "20px 24px",
                      display: "flex", alignItems: "center", gap: 20, cursor: "pointer",
                      transition: "all 0.15s",
                    }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: isLive ? "rgba(53,137,242,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${isLive ? "rgba(53,137,242,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                        🎥
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isLive && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444" }}>EN VIVO AHORA</span>
                          </div>
                        )}
                        <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 4px 0" }}>{cls.title}</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                          {fmt(cls.scheduled_at)} · {cls.duration_minutes || 60} min
                          {cls.courses && <span style={{ color: "var(--color-primary,#3589F2)" }}> · {cls.courses.title}</span>}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0, fontSize: 13, fontWeight: 600, color: isLive ? "#fff" : "var(--color-primary,#3589F2)", padding: "8px 18px", borderRadius: 10, background: isLive ? "var(--color-primary,#3589F2)" : "rgba(53,137,242,0.1)", border: isLive ? "none" : "1px solid rgba(53,137,242,0.25)" }}>
                        {isLive ? "Unirse" : u || "Ver detalle"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, marginBottom: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 8px 0" }}>No hay clases próximas</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>Aparecerá aquí cuando el instructor programe una sesión.</p>
          </div>
        )}

        {visiblePast.length > 0 && (
          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 16px 0" }}>Grabaciones anteriores</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visiblePast.map(cls => (
                <Link key={cls.id} href={`/clases-en-vivo/${cls.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, opacity: 0.7 }}>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 20, flexShrink: 0 }}>▶</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: "0 0 2px 0" }}>{cls.title}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{new Date(cls.scheduled_at).toLocaleDateString("es-MX")}</p>
                    </div>
                    {cls.recording_url ? (
                      <span style={{ fontSize: 12, color: "var(--color-primary,#3589F2)" }}>Ver grabación →</span>
                    ) : (
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Sin grabación</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
