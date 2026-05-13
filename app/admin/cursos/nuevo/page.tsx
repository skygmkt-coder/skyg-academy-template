import Link from "next/link";
import { createCourse } from "./actions";
import { VideoUrlInput, FileUploadInput } from "@/components/course/CourseFormComponents";

export default async function NuevoCursoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.35)" }}>
          ← Admin
        </Link>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
        <h1 className="font-display text-xl font-bold text-white">Nuevo curso</h1>
      </div>

      {params.error && (
        <div className="mb-5 text-sm px-4 py-3 rounded-xl"
          style={{ background: "rgba(232,0,74,0.08)", border: "1px solid rgba(232,0,74,0.2)", color: "var(--color-accent, #E8004A)" }}>
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createCourse} className="space-y-5" encType="multipart/form-data">

        {/* ── INFORMACIÓN BÁSICA ─────────────────── */}
        <div className="rounded-2xl p-6 space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider">
            Información básica
          </h2>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              Título del curso *
            </label>
            <input name="title" type="text" required
              placeholder="Ej: Fotografía Profesional desde cero"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              Descripción corta
            </label>
            <textarea name="description" rows={3}
              placeholder="¿Qué aprenderán los estudiantes?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Precio (MXN)
              </label>
              <input name="price" type="number" min="0" step="1" placeholder="999"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                  placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Nivel
              </label>
              <select name="level"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                  focus:outline-none focus:border-primary/50 transition-colors">
                <option value="">Seleccionar nivel</option>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Duración (horas)
              </label>
              <input name="duration_hours" type="number" min="0" step="0.5" placeholder="12"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                  placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Programar publicación
              </label>
              <input name="scheduled_at" type="datetime-local"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 text-sm
                  focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
          </div>
        </div>

        {/* ── VIDEO PROMOCIONAL ──────────────────── */}
        <div className="rounded-2xl p-6 space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider">
            Video promocional
          </h2>
          <VideoUrlInput
            name="promo_video_url"
            label="URL del video de presentación"
            placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
          />
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            Este video aparece en la página de venta del curso. Usa un video de YouTube o Vimeo no listado.
          </p>
        </div>

        {/* ── IMAGEN / PORTADA ───────────────────── */}
        <div className="rounded-2xl p-6 space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider">
            Imagen de portada
          </h2>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              URL de imagen (recomendado)
            </label>
            <input name="thumbnail_url" type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors mb-3" />
          </div>
          <FileUploadInput
            name="thumbnail_file"
            label="O sube un archivo"
            accept="image/png,image/jpeg,image/webp"
            hint="PNG, JPG o WebP · Recomendado: 1280×720px"
          />
        </div>

        {/* ── ACCIONES ───────────────────────────── */}
        <div className="flex gap-3">
          <button type="submit"
            className="flex-1 font-semibold py-3 rounded-xl transition-all text-sm"
            style={{
              background: "var(--color-primary, #3589F2)",
              color: "#fff",
            }}>
            Crear curso →
          </button>
          <Link href="/admin"
            className="px-6 py-3 rounded-xl text-sm font-medium text-center transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
            }}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
