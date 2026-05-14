import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen p-6 md:p-10 text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-zinc-400">Admin</p>
          <h1 className="text-4xl font-bold">
            Cursos
          </h1>
        </div>

        <Link
          href="/admin/cursos/nuevo"
          className="px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 transition"
        >
          + Nuevo curso
        </Link>
      </div>

      {!courses || courses.length === 0 ? (
        <div className="glass rounded-3xl border border-white/10 p-10 text-center">
          <h2 className="text-2xl font-semibold mb-2">
            No hay cursos todavía
          </h2>

          <p className="text-zinc-400 mb-6">
            Crea tu primer curso para comenzar.
          </p>

          <Link
            href="/admin/cursos/nuevo"
            className="inline-flex px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 transition"
          >
            Crear curso
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {courses.map((course: any) => (
            <div
              key={course.id}
              className="glass rounded-3xl border border-white/10 p-6 flex flex-col md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="text-2xl font-semibold">
                  {course.title}
                </h2>

                <p className="text-zinc-400 mt-2">
                  {course.description || "Sin descripción"}
                </p>

                <div className="flex gap-3 mt-4 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm">
                    {course.level || "Principiante"}
                  </span>

                  <span className="px-3 py-1 rounded-full bg-white/5 text-zinc-300 text-sm">
                    ${course.price_cents || 0} MXN
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6 md:mt-0">
                <Link
                  href={`/curso/${course.slug}`}
                  className="px-4 py-2 rounded-2xl border border-white/10 hover:bg-white/5"
                >
                  Ver
                </Link>

                <Link
                  href={`/admin/cursos/${course.id}`}
                  className="px-4 py-2 rounded-2xl bg-blue-500 hover:bg-blue-600"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
