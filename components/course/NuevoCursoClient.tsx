"use client";

import { useState, useRef } from "react";
import { Icons } from "@/components/ui/Icons";

const COURSE_TYPES = [
  { value: "diplomado",  label: "Diplomado",         icon: "📜" },
  { value: "course",     label: "Curso",              icon: "🎓" },
  { value: "taller",     label: "Taller",             icon: "🛠" },
  { value: "clase",      label: "Clase pre-grabada",  icon: "▶️" },
];

const inputS: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
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

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px 0" }}>
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

function getEmbed(url: string) {
  if (!url) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.includes("v=") ? url.split("v=")[1]?.split("&")[0] : url.split("/").pop();
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
  }
  if (url.includes("vimeo.com")) {
    const id = url.split("/").pop();
    return `https://player.vimeo.com/video/${id}?title=0&byline=0`;
  }
  return null;
}

export default function NuevoCursoClient() {
  const [type, setType] = useState("course");
  const [promoUrl, setPromoUrl] = useState("");
  const [showPromoPreview, setShowPromoPreview] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const embedUrl = getEmbed(promoUrl);
  const isValidVideo = !!embedUrl;
  const coverPreview = coverFile ? URL.createObjectURL(coverFile) : coverUrl;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    if (coverFile) fd.set("thumbnail_file", coverFile);

    const res = await fetch("/api/admin/create-course", { method: "POST", body: fd });
    const json = await res.json();

    if (json.error) {
      setError(json.error);
      setLoading(false);
    } else {
      window.location.href = `/admin/cursos/${json.id}`;
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(232,0,74,0.08)", border: "1px solid rgba(232,0,74,0.2)", color: "#E8004A", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ── TIPO ──────────────────────────────────── */}
      <Block title="Tipo de contenido">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
          {COURSE_TYPES.map(ct => (
            <label key={ct.value} style={{ cursor: "pointer" }}>
              <input type="radio" name="course_type" value={ct.value}
                checked={type === ct.value}
                onChange={() => setType(ct.value)}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
              <div style={{
                padding: "12px 16px", borderRadius: 12, transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 10,
                background: type === ct.value ? "rgba(53,137,242,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${type === ct.value ? "rgba(53,137,242,0.4)" : "rgba(255,255,255,0.07)"}`,
              }}>
                <span style={{ fontSize: 20 }}>{ct.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: type === ct.value ? "#fff" : "rgba(255,255,255,0.5)" }}>
                  {ct.label}
                </span>
              </div>
            </label>
          ))}
        </div>
      </Block>

      {/* ── INFO BÁSICA ───────────────────────────── */}
      <Block title="Información básica">
        <Field label="Título *">
          <input name="title" type="text" required
            placeholder="Ej: Fotografía Profesional desde cero"
            style={inputS} />
        </Field>

        <Field label="Descripción">
          <textarea name="description" rows={3}
            placeholder="¿Qué aprenderán los estudiantes?"
            style={{ ...inputS, resize: "none" }} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Precio (MXN)">
            <input name="price" type="number" min="0" placeholder="999" style={inputS} />
          </Field>
          <Field label="Nivel">
            <select name="level" style={inputS}>
              <option value="">Seleccionar</option>
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
            </select>
          </Field>
          <Field label="Duración (horas)">
            <input name="duration_hours" type="number" min="0" step="0.5" placeholder="12" style={inputS} />
          </Field>
          <Field label="Programar publicación">
            <input name="scheduled_at" type="datetime-local"
              style={{ ...inputS, color: "rgba(255,255,255,0.7)" }} />
          </Field>
        </div>
      </Block>

      {/* ── VISIBILIDAD ───────────────────────────── */}
      <Block title="Visibilidad">
        {[
          { name: "show_in_landing", label: "Mostrar en la landing", desc: "Aparece en la sección de cursos de la página principal" },
          { name: "show_in_store",   label: "Mostrar en la tienda",  desc: "Aparece en /tienda con precio y botón de compra" },
        ].map(opt => (
          <label key={opt.name} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
            <input name={opt.name} type="checkbox" defaultChecked
              style={{ accentColor: "var(--color-primary,#3589F2)", width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 1px 0" }}>{opt.label}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{opt.desc}</p>
            </div>
          </label>
        ))}
      </Block>

      {/* ── VIDEO DE PRESENTACIÓN ─────────────────── */}
      <Block title="Video de presentación">
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Este video se muestra en la landing y en la tienda. Pega un link de YouTube o Vimeo.
        </p>

        <Field label="URL del video">
          <div style={{ display: "flex", gap: 8 }}>
            <input
              name="promo_video_url"
              type="url"
              value={promoUrl}
              onChange={e => { setPromoUrl(e.target.value); setShowPromoPreview(false); }}
              placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
              style={{
                ...inputS, flex: 1,
                borderColor: promoUrl && !isValidVideo
                  ? "rgba(232,0,74,0.4)"
                  : promoUrl && isValidVideo
                    ? "rgba(74,222,128,0.3)"
                    : "rgba(255,255,255,0.1)",
              }}
            />
            {isValidVideo && (
              <button type="button"
                onClick={() => setShowPromoPreview(v => !v)}
                style={{
                  padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", whiteSpace: "nowrap", border: "1px solid rgba(53,137,242,0.3)",
                  background: showPromoPreview ? "rgba(53,137,242,0.2)" : "rgba(53,137,242,0.1)",
                  color: "var(--color-primary,#3589F2)",
                }}>
                {showPromoPreview ? "Ocultar" : "▶ Preview"}
              </button>
            )}
          </div>
          {promoUrl && (
            <p style={{ fontSize: 11, margin: "2px 0 0 0", color: isValidVideo ? "#4ade80" : "#f87171" }}>
              {isValidVideo
                ? `✓ ${promoUrl.includes("vimeo") ? "Vimeo" : "YouTube"} detectado`
                : "⚠ URL no reconocida — usa YouTube o Vimeo"}
            </p>
          )}
        </Field>

        {/* Promo video preview */}
        {showPromoPreview && embedUrl && (
          <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", background: "#000", border: "1px solid rgba(255,255,255,0.1)" }}>
            <iframe
              src={embedUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        )}
      </Block>

      {/* ── IMAGEN DE PORTADA ─────────────────────── */}
      <Block title="Imagen de portada">
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Se muestra en la landing, tienda y dashboard del alumno.
        </p>

        {/* Preview */}
        {coverPreview && (
          <div style={{
            aspectRatio: "16/9", borderRadius: 12, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            background: `url(${coverPreview}) center/cover`,
            position: "relative",
          }}>
            <button type="button"
              onClick={() => { setCoverUrl(""); setCoverFile(null); if (fileRef.current) fileRef.current.value = ""; }}
              style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(0,0,0,0.7)", border: "none",
                color: "#fff", borderRadius: 6, padding: "4px 8px",
                fontSize: 12, cursor: "pointer",
              }}>
              × Quitar
            </button>
          </div>
        )}

        {/* URL input */}
        <Field label="URL de imagen">
          <input
            name="thumbnail_url"
            type="url"
            value={coverUrl}
            onChange={e => { setCoverUrl(e.target.value); setCoverFile(null); }}
            placeholder="https://ejemplo.com/imagen.jpg"
            style={inputS}
          />
        </Field>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>o</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* File upload */}
        <label style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 10, cursor: "pointer",
          background: "rgba(255,255,255,0.02)",
          border: `1px dashed ${coverFile ? "rgba(53,137,242,0.4)" : "rgba(255,255,255,0.12)"}`,
          transition: "all 0.2s",
        }}>
          <Icons.download size={18} />
          <div>
            <p style={{ fontSize: 13, color: coverFile ? "#fff" : "rgba(255,255,255,0.5)", margin: 0, fontWeight: coverFile ? 600 : 400 }}>
              {coverFile ? coverFile.name : "Subir imagen desde tu computadora"}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: "2px 0 0 0" }}>
              PNG, JPG o WebP · Recomendado 1280×720px
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={e => {
              const f = e.target.files?.[0] || null;
              setCoverFile(f);
              if (f) setCoverUrl("");
            }}
          />
        </label>
      </Block>

      {/* ── SUBMIT ────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" disabled={loading}
          style={{
            flex: 1, padding: "14px 0", borderRadius: 12, fontSize: 14, fontWeight: 700,
            background: loading ? "rgba(53,137,242,0.5)" : "var(--color-primary,#3589F2)",
            color: "#fff", border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}>
          {loading ? "Creando..." : "Crear → agregar módulos y lecciones"}
        </button>
        <a href="/admin/cursos"
          style={{
            padding: "14px 24px", borderRadius: 12, fontSize: 13,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.4)", textDecoration: "none",
            display: "inline-flex", alignItems: "center",
          }}>
          Cancelar
        </a>
      </div>

    </form>
  );
}
