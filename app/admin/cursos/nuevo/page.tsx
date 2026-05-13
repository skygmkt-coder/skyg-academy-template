import Link from "next/link";
import { createCourse } from "./actions";

export default async function NuevoCursoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-sm text-white/40 hover:text-white transition-colors">
          ← Admin
        </Link>
        <span className="text-white/20">/</span>
        <h1 className="font-display text-xl font-bold text-white">Nuevo curso</h1>
      </div>

      {params.error && (
        <div className="mb-6 bg-accent/10 border border-accent/20 text-accent text-sm px-4 py-3 rounded-xl">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <div className="glass rounded-2xl p-6 border border-white/8">
        <form action={createCourse} className="space-y-5">

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              Título del curso *
            </label>
            <input name="title" type="text" required placeholder="Ej: Fotografía Profesional desde cero"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 text-sm transition-colors" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              Descripción
            </label>
            <textarea name="description" rows={3}
              placeholder="Describe qué aprenderán los estudiantes en este curso..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 text-sm transition-colors resize-none" />
          </div>

          {/* Price + Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Precio (MXN)
              </label>
              <input name="price" type="number" min="0" step="1" placeholder="999"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 text-sm transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Programar publicación
              </label>
              <input name="scheduled_at" type="datetime-local"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 focus:outline-none focus:border-primary/50 text-sm transition-colors" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all hover:shadow-glow">
              Crear curso →
            </button>
            <Link href="/admin"
              className="px-5 py-3 glass rounded-xl text-sm text-white/50 hover:text-white transition-all border border-white/5 hover:border-white/10 text-center">
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-4 glass rounded-xl p-4 border border-white/5">
        <p className="text-xs text-white/30 leading-relaxed">
          💡 <strong className="text-white/50">Siguiente paso:</strong> Después de crear el curso podrás agregar módulos, lecciones y videos desde el editor.
          La fecha de programación publica automáticamente el curso en esa fecha y hora.
        </p>
      </div>
    </div>
  );
}
