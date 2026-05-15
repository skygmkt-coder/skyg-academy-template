import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function CountdownDisplay({ scheduledAt }: { scheduledAt: string }) {
  const target = new Date(scheduledAt).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return null;

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
      {[[d,"días"],[h,"horas"],[m,"min"]].map(([n,l]) => (
        <div key={String(l)} style={{ textAlign: "center", minWidth: 64, padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{n}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

export default async function LiveClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: cls } = await supabase
    .from("live_classes")
    .select("*, courses(id, title, slug)")
    .eq("id", id)
    .single();

  if (!cls) notFound();

  // Access check
  if (!cls.is_public) {
    if (!user) redirect("/login");
    if (cls.courses) {
      const { data: enrollment } = await supabase.from("enrollments")
        .select("id").eq("user_id", user.id)
        .eq("course_id", cls.courses.id).eq("active", true).single();
      if (!enrollment) {
        const { data: profile } = await supabase.from("profiles")
          .select("is_admin, is_super_admin").eq("id", user.id).single();
        if (!profile?.is_admin && !profile?.is_super_admin) redirect("/dashboard");
      }
    }
  }

  const now = Date.now();
  const classTime = new Date(cls.scheduled_at).getTime();
  const isLive = Math.abs(now - classTime) < 30 * 60 * 1000;
  const isPast = now > classTime + (cls.duration_minutes || 60) * 60 * 1000;
  const isFuture = now < classTime - 5 * 60 * 1000;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base,#070B12)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <Link href="/clases-en-vivo" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>← Clases en vivo</Link>
        </div>

        {/* Status */}
        {isLive && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", letterSpacing: "0.06em" }}>EN VIVO AHORA</span>
          </div>
        )}

        <h1 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, color: "#fff", margin: "0 0 12px 0", fontFamily: "var(--font-display,Sora,sans-serif)" }}>
          {cls.title}
        </h1>
        {cls.description && (
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 20, lineHeight: 1.6 }}>{cls.description}</p>
        )}

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            📅 {new Date(cls.scheduled_at).toLocaleString("es-MX", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>⏱ {cls.duration_minutes || 60} min</span>
          {cls.courses && (
            <Link href={`/cursos/${cls.courses.slug}`} style={{ fontSize: 13, color: "var(--color-primary,#3589F2)", textDecoration: "none" }}>
              📚 {cls.courses.title}
            </Link>
          )}
        </div>

        {/* Main content area */}
        {isPast && cls.recording_url ? (
          // Show recording
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Grabación de la clase</h2>
            <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "16/9", border: "1px solid rgba(255,255,255,0.08)" }}>
              <iframe src={cls.recording_url} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />
            </div>
          </div>
        ) : isPast ? (
          // Past, no recording
          <div style={{ textAlign: "center", padding: "48px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📼</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 8px 0" }}>Clase finalizada</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>La grabación estará disponible próximamente.</p>
          </div>
        ) : isLive ? (
          // Join Zoom
          <div style={{ textAlign: "center", padding: "48px 24px", background: "rgba(53,137,242,0.08)", border: "1px solid rgba(53,137,242,0.2)", borderRadius: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎥</div>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 8px 0" }}>¡La clase está en vivo!</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "0 0 24px 0" }}>Únete ahora para no perderte el contenido.</p>
            {cls.zoom_url ? (
              <a href={cls.zoom_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", borderRadius: 99, fontSize: 15, fontWeight: 700, background: "var(--color-primary,#3589F2)", color: "#fff", textDecoration: "none" }}>
                🎥 Unirse ahora a Zoom
              </a>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.4)" }}>Link de acceso no disponible</p>
            )}
          </div>
        ) : (
          // Future
          <div style={{ textAlign: "center", padding: "48px 24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 4px 0" }}>La clase inicia en</p>
            <CountdownDisplay scheduledAt={cls.scheduled_at} />
            {cls.zoom_url && (
              <div style={{ marginTop: 24 }}>
                <a href={cls.zoom_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 99, fontSize: 14, fontWeight: 600, background: "rgba(53,137,242,0.12)", border: "1px solid rgba(53,137,242,0.25)", color: "var(--color-primary,#3589F2)", textDecoration: "none" }}>
                  Agregar al calendario / Zoom
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
