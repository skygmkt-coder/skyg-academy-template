import Link from "next/link";
import { createCourse } from "./actions";
import { VideoUrlInput, FileUploadInput } from "@/components/course/CourseFormComponents";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  padding: "10px 14px", color: "#fff", fontSize: 13,
  outline: "none", boxSizing: "border-box",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>{hint}</p>}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px 0" }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </div>
  );
}

function CheckOption({ name, defaultChecked, label, desc }: { name: string; defaultChecked?: boolean; label: string; desc: string }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
      <input name={name} type="checkbox" defaultChecked={defaultChecked}
        style={{ accentColor: "var(--color-primary, #3589F2)", width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 2px 0" }}>{label}</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{desc}</p>
      </div>
    </label>
  );
}

export default async function NuevoCursoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <Link href="/admin/cursos" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>← Cursos</Link>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "var(--font-display, Sora, sans-serif)" }}>Nuevo contenido</h1>
      </div>

      {params.error && (
        <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 12, background: "rgba(232,0,74,0.08)", border: "1px solid rgba(232,0,74,0.2)", color: "#E8004A", fontSize: 13 }}>
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createCourse} encType="multipart/form-data" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* TIPO */}
        <Block title="Tipo de contenido">
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>Define cómo se organiza este contenido</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { v: "course",    label: "Curso individual",  desc: "Módulos + lecciones. El más común.",        icon: "🎓" },
              { v: "diplomado", label: "Diplomado",         desc: "Programa extenso con múltiples módulos.",   icon: "📜" },
              { v: "module",    label: "Módulo",            desc: "Sección de un diplomado o curso mayor.",    icon: "📦" },
              { v: "lesson",    label: "Lección suelta",    desc: "Una clase individual, sin módulos.",        icon: "▶️" },
            ].map(ct => (
              <label key={ct.v} style={{ cursor: "pointer", display: "block" }}>
                <input type="radio" name="course_type" value={ct.v} defaultChecked={ct.v === "course"}
                  style={{ position: "absolute", opacity: 0 }} />
                <div style={{ padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{ct.icon}</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 3px 0" }}>{ct.label}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.4 }}>{ct.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Block>

        {/* INFO */}
        <Block title="Información básica">
          <Field label="Título *">
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
              <input name="scheduled_at" type="datetime-local" style={{ ...inputStyle, color: "rgba(255,255,255,0.7)" }} />
            </Field>
          </div>
        </Block>

        {/* VISIBILIDAD */}
        <Block title="Visibilidad">
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            Controla dónde aparece. Desactiva ambos para crear un <strong style={{ color: "rgba(255,255,255,0.6)" }}>aula privada</strong> solo accesible a alumnos que tú asignes manualmente.
          </p>
          <CheckOption name="show_in_landing" defaultChecked label="Mostrar en la landing" desc="Aparece en la sección de cursos de la página principal" />
          <CheckOption name="show_in_store" defaultChecked label="Mostrar en la tienda" desc="Aparece en /tienda con precio y botón de compra" />
        </Block>

        {/* VIDEO */}
        <Block title="Video promocional">
          <VideoUrlInput name="promo_video_url" label="URL del video (YouTube o Vimeo)" placeholder="https://youtube.com/watch?v=..." />
        </Block>

        {/* PORTADA */}
        <Block title="Imagen de portada">
          <Field label="URL de imagen">
            <input name="thumbnail_url" type="url" placeholder="https://ejemplo.com/imagen.jpg" style={inputStyle} />
          </Field>
          <FileUploadInput name="thumbnail_file" label="O sube un archivo" accept="image/png,image/jpeg,image/webp" hint="PNG, JPG o WebP · 1280×720px recomendado" />
        </Block>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" style={{ flex: 1, padding: "13px 0", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "var(--color-primary, #3589F2)", color: "#fff", border: "none", cursor: "pointer" }}>
            Crear → agregar módulos y lecciones
          </button>
          <Link href="/admin/cursos" style={{ padding: "13px 24px", borderRadius: 12, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
