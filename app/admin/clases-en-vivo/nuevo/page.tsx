import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { createLiveClass } from "../actions";

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

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  padding: "10px 14px", color: "#fff", fontSize: 13,
  outline: "none", boxSizing: "border-box",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>{hint}</p>}
    </div>
  );
}

export default async function NuevaClasePage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: courses } = await supabase.from("courses").select("id, title").eq("published", true);

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <Link href="/admin/clases-en-vivo" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
          ← Clases en vivo
        </Link>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "var(--font-display, Sora, sans-serif)" }}>
          Nueva clase en vivo
        </h1>
      </div>

      {params.error && (
        <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 12, background: "rgba(232,0,74,0.08)", border: "1px solid rgba(232,0,74,0.2)", color: "#E8004A", fontSize: 13 }}>
          {decodeURIComponent(params.error)}
        </div>
      )}

      {/* Zoom info */}
      <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 12, background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.15)", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
        💡 <strong style={{ color: "rgba(255,255,255,0.7)" }}>Cómo obtener el link de Zoom:</strong> Crea una reunión en Zoom → click en "Copiar link de invitación" → pégalo abajo.
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
        <form action={createLiveClass} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <Field label="Título de la clase *">
            <input name="title" required placeholder="Ej: Clase en vivo — Preguntas y respuestas" style={inputStyle} />
          </Field>

          <Field label="Descripción">
            <textarea name="description" rows={2} placeholder="¿De qué tratará esta sesión?" style={{ ...inputStyle, resize: "none" }} />
          </Field>

          <Field label="Link de Zoom *" hint="Pega el link de invitación de tu reunión de Zoom aquí">
            <input name="zoom_url" type="url" required placeholder="https://zoom.us/j/1234567890?pwd=..." style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Fecha y hora *">
              <input name="scheduled_at" type="datetime-local" required style={{ ...inputStyle, color: "rgba(255,255,255,0.7)" }} />
            </Field>
            <Field label="Duración (minutos)">
              <input name="duration_minutes" type="number" defaultValue={60} min={15} step={15} style={inputStyle} />
            </Field>
          </div>

          <Field label="Vincular a curso (opcional)">
            <select name="course_id" style={inputStyle}>
              <option value="">Sin vincular — clase general</option>
              {courses?.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </Field>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input name="is_public" id="is_public" type="checkbox" style={{ accentColor: "var(--color-primary, #3589F2)", width: 16, height: 16 }} />
            <label htmlFor="is_public" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
              Clase pública — visible para todos sin necesidad de login
            </label>
          </div>

          <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
            <button type="submit" style={{
              flex: 1, padding: "13px 0", borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: "var(--color-primary, #3589F2)", color: "#fff", border: "none", cursor: "pointer",
            }}>🎥 Crear clase en vivo</button>
            <Link href="/admin/clases-en-vivo" style={{
              padding: "13px 24px", borderRadius: 12, fontSize: 13,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "inline-flex", alignItems: "center",
            }}>Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
