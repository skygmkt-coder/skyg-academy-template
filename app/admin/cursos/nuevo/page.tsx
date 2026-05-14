import Link from "next/link";
import { createCourse } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: "12px 14px",
  color: "#fff",
  fontSize: 14,
  outline: "none",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl border border-white/10 p-6 space-y-4">
      <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function NuevoCursoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/cursos" className="text-sm text-white/40">
          ← Cursos
        </Link>
        <h1 className="text-2xl font-bold text-white">Nuevo curso</h1>
      </div>

      {params.error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createCourse} className="space-y-6">
        <Block title="Tipo de curso">
          <Field label="Uso del curso">
            <select name="course_type" defaultValue="sellable" style={inputStyle}>
              <option value="sellable">Curso vendible</option>
              <option value="private_classroom">Aula privada / clases grabadas</option>
            </select>
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 text-sm text-white/70">
              <input
                name="show_on_landing"
                type="checkbox"
                defaultChecked
                className="accent-primary"
              />
              Mostrar en landing
            </label>

            <label className="flex items-center gap-3 text-sm text-white/70">
              <input
                name="show_in_store"
                type="checkbox"
                defaultChecked
                className="accent-primary"
              />
              Mostrar en tienda
            </label>
          </div>
        </Block>

        <Block title="Información básica">
          <Field label="Título del curso *">
            <input
              name="title"
              required
              placeholder="Ej: Fotografía profesional desde cero"
              style={inputStyle}
            />
          </Field>

          <Field label="Descripción">
            <textarea
              name="description"
              rows={4}
              placeholder="Describe qué aprenderá el alumno"
              style={{ ...inputStyle, resize: "none" }}
            />
          </Field>

          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Precio MXN">
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

            <Field label="Duración horas">
              <input
                name="duration_hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="4"
                style={inputStyle}
              />
            </Field>
          </div>
        </Block>

        <Block title="Contenido visual">
          <Field label="Video de presentación YouTube/Vimeo">
            <input
              name="promo_video_url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              style={inputStyle}
            />
          </Field>

          <Field label="Imagen de portada URL">
            <input
              name="thumbnail_url"
              type="url"
              placeholder="https://..."
              style={inputStyle}
            />
          </Field>
        </Block>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-5 py-4 text-sm font-bold text-white hover:bg-primary-dark transition"
        >
          Crear curso
        </button>
      </form>
    </div>
  );
}
