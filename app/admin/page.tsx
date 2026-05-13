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
        getAll() { return cookieStore.getAll(); },
        setAll(c: any[]) {
          try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalCourses },
    { count: publishedCourses },
    { count: totalUsers },
    { count: totalOrders },
    { data: orders },
    { data: recentCourses },
    { data: upcomingClasses },
  ] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("orders").select("amount_cents").eq("status", "paid"),
    supabase.from("courses").select("id,title,published,scheduled_at,created_at")
      .order("created_at", { ascending: false }).limit(5),
    supabase.from("live_classes").select("id,title,scheduled_at,zoom_url")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true }).limit(3),
  ]);

  const totalRevenue = orders?.reduce((sum, o) => sum + (o.amount_cents || 0), 0) || 0;

  const stats = [
    { label: "Cursos totales", value: totalCourses || 0, sub: `${publishedCourses || 0} publicados`, icon: "📚", color: "rgba(53,137,242,0.12)", border: "rgba(53,137,242,0.25)" },
    { label: "Estudiantes", value: totalUsers || 0, sub: "Usuarios registrados", icon: "🎓", color: "rgba(22,163,74,0.12)", border: "rgba(22,163,74,0.25)" },
    { label: "Ventas", value: totalOrders || 0, sub: "Pagos completados", icon: "💳", color: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)" },
    { label: "Ingresos", value: `$${(totalRevenue / 100).toLocaleString()}`, sub: "MXN total", icon: "💰", color: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Vista general de tu academia</p>
        </div>
        <Link href="/admin/cursos/nuevo"
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-glow">
          ➕ Nuevo curso
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-5 border"
            style={{ background: s.color, borderColor: s.border }}>
            <div className="text-2xl mb-3">{s.icon}</div>
            <div className="font-display text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-white/50 mt-1">{s.label}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-white">Cursos recientes</h2>
            <Link href="/admin" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            {recentCourses?.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-white/30">
                No hay cursos aún.{" "}
                <Link href="/admin/cursos/nuevo" className="text-primary hover:underline">Crear uno</Link>
              </div>
            )}
            {recentCourses?.map((c, i) => (
              <div key={c.id}
                className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-white/5" : ""}`}>
                <div>
                  <p className="text-sm font-medium text-white">{c.title}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {c.scheduled_at
                      ? `Programado: ${new Date(c.scheduled_at).toLocaleDateString("es-MX")}`
                      : new Date(c.created_at).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    c.published
                      ? "bg-green-500/15 text-green-400 border border-green-500/20"
                      : c.scheduled_at
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : "bg-white/5 text-white/40 border border-white/10"
                  }`}>
                    {c.published ? "Publicado" : c.scheduled_at ? "Programado" : "Borrador"}
                  </span>
                  <Link href={`/admin/cursos/${c.id}`}
                    className="text-xs text-primary hover:underline">
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming live classes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-white">Próximas clases en vivo</h2>
            <Link href="/admin/clases-en-vivo" className="text-xs text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            {(!upcomingClasses || upcomingClasses.length === 0) && (
              <div className="px-5 py-8 text-center text-sm text-white/30">
                No hay clases programadas.{" "}
                <Link href="/admin/clases-en-vivo/nuevo" className="text-primary hover:underline">Crear una</Link>
              </div>
            )}
            {upcomingClasses?.map((c, i) => (
              <div key={c.id}
                className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-white/5" : ""}`}>
                <div>
                  <p className="text-sm font-medium text-white">{c.title}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {new Date(c.scheduled_at).toLocaleString("es-MX", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                <a href={c.zoom_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/25 transition-all">
                  🎥 Zoom
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
