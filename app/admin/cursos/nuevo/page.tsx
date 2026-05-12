import { createCourse } from "./actions";

export default async function NuevoCursoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-white mb-8">
        Nuevo curso
      </h1>

      <div className="glass rounded-2xl p-6 border border-white/5">
        {params.error && (
          <div className="mb-4 text-accent text-sm bg-accent/10 border border-accent/20 rounded-xl p-3">
            {decodeURIComponent(params.error)}
          </div>
        )}

        <form action={createCourse} className="space-y-5">
          {[
            [
              "title",
              "Título del curso",
              "text",
              "Ej: Fotografía Profesional",
            ],
            [
              "description",
              "Descripción",
              "text",
              "Describe qué aprenderán tus estudiantes",
            ],
            ["price", "Precio (MXN)", "number", "999"],
          ].map(([n, l, t, p]) => (
            <div key={n}>
              <label className="text-sm text-muted mb-2 block">
                {l}
              </label>

              {n === "description" ? (
                <textarea
                  name={String(n)}
                  placeholder={String(p)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:outline-none focus:border-primary/50 text-sm resize-none"
                />
              ) : (
                <input
                  name={String(n)}
                  type={String(t)}
                  required
                  placeholder={String(p)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:outline-none focus:border-primary/50 text-sm"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            className="bg-primary text-white font-semibold px-6 py-3 rounded-xl w-full hover:bg-primary-dark transition-all"
          >
            Crear curso →
          </button>
        </form>
      </div>
    </div>
  );
}
