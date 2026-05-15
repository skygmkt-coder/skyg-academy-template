import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, slug, description, price_cents, level, published, course_type, show_in_landing, show_in_store, created_at, thumbnail_url")
    .order("created_at", { ascending: false });

  const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    published: { bg: "rgba(22,163,74,0.1)", color: "#4ade80", border: "rgba(22,163,74,0.2)" },
    draft:     { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", border: "rgba(255,255,255,0.1)" },
  };

  const TYPE_LABELS: Record<string,string> = { diplomado: "📜 Diplomado", course: "🎓 Curso", taller: "🛠 Taller", clase: "▶️ Clase" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "var(--font-display,Sora,sans-serif)" }}>Cursos</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "4px 0 0 0" }}>{courses?.length || 0} contenidos</p>
        </div>
        <Link href="/admin/cursos/nuevo" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: "var(--color-primary,#3589F2)", color: "#fff", textDecoration: "none" }}>
          + Nuevo contenido
        </Link>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(232,0,74,0.08)", border: "1px solid rgba(232,0,74,0.2)", color: "#E8004A", fontSize: 13 }}>
          Error cargando cursos: {error.message}
        </div>
      )}

      {!courses || courses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20 }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>📚</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px 0" }}>No hay contenido aún</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px 0" }}>Crea tu primer curso para comenzar.</p>
          <Link href="/admin/cursos/nuevo" style={{ padding: "10px 24px", borderRadius: 99, fontSize: 13, fontWeight: 700, background: "var(--color-primary,#3589F2)", color: "#fff", textDecoration: "none", display: "inline-block" }}>
            Crear contenido
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {courses.map(c => {
            const st = c.published ? "published" : "draft";
            const sc = STATUS_COLORS[st];
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, transition: "all 0.15s" }}>
                {/* Thumbnail */}
                <div style={{
                  width: 56, height: 40, borderRadius: 8, flexShrink: 0, overflow: "hidden",
                  background: c.thumbnail_url ? `url(${c.thumbnail_url}) center/cover` : "linear-gradient(135deg,rgba(53,137,242,0.2),rgba(13,20,33,1))",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 16,
                }}>
                  {!c.thumbnail_url && "▶"}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{TYPE_LABELS[c.course_type || "course"] || "Curso"}</span>
                    {c.level && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>· {c.level}</span>}
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>· ${(c.price_cents/100).toLocaleString()} MXN</span>
                  </div>
                </div>

                {/* Visibility badges */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {c.show_in_landing && (
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "rgba(53,137,242,0.1)", border: "1px solid rgba(53,137,242,0.2)", color: "var(--color-primary,#3589F2)" }}>Landing</span>
                  )}
                  {c.show_in_store && (
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>Tienda</span>
                  )}
                </div>

                {/* Status */}
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, flexShrink: 0, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                  {c.published ? "Publicado" : "Borrador"}
                </span>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <a href={`/cursos/${c.slug}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
                    Ver
                  </a>
                  <Link href={`/admin/cursos/${c.id}`}
                    style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, background: "var(--color-primary,#3589F2)", color: "#fff", textDecoration: "none" }}>
                    Editar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
