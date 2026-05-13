import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) =>
                cookieStore.set(
                  name,
                  value,
                  options
                )
            );
          } catch {}
        },
      },
    }
  );
}

export default async function AdminPage() {
  const supabase =
    await createClient();

  const { data: courses } =
    await supabase
      .from("courses")
      .select(
        "id,title,published,price_cents"
      )
      .order("created_at", {
        ascending: false,
      });

  const { count: userCount } =
    await supabase
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true,
      });

  const { count: orderCount } =
    await supabase
      .from("orders")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "paid");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold text-white">
          Panel de administrador
        </h1>

        <Link
          href="/admin/cursos/nuevo"
          className="bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-all"
        >
          + Nuevo curso
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-10">
        {[
          [
            "Cursos",
            courses?.length || 0,
            "📚",
          ],

          [
            "Estudiantes",
            userCount || 0,
            "🎓",
          ],

          [
            "Ventas",
            orderCount || 0,
            "💳",
          ],
        ].map(
          ([label, val, icon]) => (
            <div
              key={String(label)}
              className="glass rounded-2xl p-6 border border-white/5"
            >
              <div className="text-2xl mb-2">
                {icon}
              </div>

              <div className="font-display text-3xl font-bold text-white">
                {val}
              </div>

              <div className="text-sm text-muted mt-1">
                {label}
              </div>
            </div>
          )
        )}
      </div>

      <h2 className="font-display text-lg font-semibold text-white mb-4">
        Cursos
      </h2>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        {courses?.map(
          (c, i) => (
            <div
              key={c.id}
              className={`flex items-center justify-between px-6 py-4 ${
                i > 0
                  ? "border-t border-white/5"
                  : ""
              }`}
            >
              <div>
                <p className="font-medium text-white text-sm">
                  {c.title}
                </p>

                <p className="text-xs text-muted">
                  $
                  {(
                    c.price_cents /
                    100
                  ).toLocaleString()}{" "}
                  MXN
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    c.published
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-white/5 text-muted border border-white/10"
                  }`}
                >
                  {c.published
                    ? "Publicado"
                    : "Borrador"}
                </span>

                <Link
                  href={`/admin/cursos/${c.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Editar
                </Link>
              </div>
            </div>
          )
        )}

        {(!courses ||
          courses.length === 0) && (
          <p className="px-6 py-8 text-sm text-muted text-center">
            No hay cursos aún.
          </p>
        )}
      </div>
    </div>
  );
}
