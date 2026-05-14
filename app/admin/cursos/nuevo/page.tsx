import Link from "next/link";
import { createCourse } from "./actions";
import { VideoUrlInput, FileUploadInput } from "@/components/course/CourseFormComponents";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  padding: "10px 14px", color: "#fff", fontSize: 13,
  outline: "none", boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, margin: "0 0 16px 0" }}>
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

export default async function NuevoCursoPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>← Admin</Link>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "var(--font-display, Sora, sans-serif)" }}>
          Nuevo curso
        </h1>
      </div>

      {params.error && (
        <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 12, background: "rgba(232,0,74,0.08)", border: "1px solid rgba(232,0,74,0.2)", color: "#E8004A", fontSize: 13 }}>
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createCourse} encType="multipart/form-data" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        <Block title="Información básica">
          <Field label="Título del curso *">
            <input name="title" type="text" required placeholder="Ej: Fotografía Profesional desde cero" style={inputStyle} />
          </Field>
          <Field label="Descripción">
            <textarea name="description" rows={3} placeholder="¿Qué aprenderán los estudiantes?" style={{ ...inputStyle, resize: "none" }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Precio (MXN)">
              <input name="price" type="number" min="0" placeholder="999" style={inputStyle} />
            </Field>
            <Field label="Nivel">
              <select name="level" style={inputStyle}>
                <option value="">Seleccionar</option>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </Field>
            <Field label="Duración (horas)">
              <input name="duration_hours" type="number" min="0" step="0.5" placeholder="12" style={inputStyle} />
            </Field>
            <Field label="Programar publicación">
              <input name="scheduled_at" type="datetime-local" style={{ ...inputStyle, color: "rgba(255,255,255,0.6)" }} />
            </Field>
          </div>
        </Block>

        <Block title="Video promocional">
          <VideoUrlInput name="promo_video_url" label="URL del video (YouTube o Vimeo)" placeholder="https://youtube.com/watch?v=..." />
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>
            Sube el video como "No listado" en YouTube para que solo sea accesible desde tu academia.
          </p>
        </Block>

        <Block title="Imagen de portada">
          <Field label="URL de imagen">
            <input name="thumbnail_url" type="url" placeholder="https://ejemplo.com/imagen.jpg" style={inputStyle} />
          </Field>
          <FileUploadInput name="thumbnail_file" label="O sube un archivo" accept="image/png,image/jpeg,image/webp" hint="PNG, JPG o WebP · 1280×720px recomendado" />
        </Block>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" style={{
            flex: 1, padding: "13px 0", borderRadius: 12, fontSize: 14, fontWeight: 700,
            background: "var(--color-primary, #3589F2)", color: "#fff", border: "none", cursor: "pointer",
          }}>Crear curso →</button>
          <Link href="/admin" style={{
            padding: "13px 24px", borderRadius: 12, fontSize: 13,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "inline-flex", alignItems: "center",
          }}>Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
