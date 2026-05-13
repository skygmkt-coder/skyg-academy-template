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

export default async function UsuariosPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, is_admin, is_super_admin, created_at")
    .order("created_at", { ascending: false });

  // Count enrollments per user
  const { data: enrollmentCounts } = await supabase
    .from("enrollments")
    .select("user_id")
    .eq("active", true);

  const countMap: Record<string, number> = {};
  enrollmentCounts?.forEach(e => {
    countMap[e.user_id] = (countMap[e.user_id] || 0) + 1;
  });

  const getRoleBadge = (p: any) => {
    if (p.is_super_admin) return { label: "⭐ Super Admin", bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.25)" };
    if (p.is_admin) return { label: "🛡 Admin", bg: "rgba(53,137,242,0.12)", color: "#60a5fa", border: "rgba(53,137,242,0.25)" };
    return { label: "🎓 Alumno", bg: "rgba(255,255,255,0.04)", color: "#8FA4C4", border: "rgba(255,255,255,0.08)" };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Usuarios</h1>
          <p className="text-sm text-white/40 mt-1">{profiles?.length || 0} usuarios registrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {["Todos", "Alumnos", "Admins"].map(f => (
          <span key={f}
            className={`text-xs px-3 py-1.5 rounded-full cursor-pointer transition-all border ${
              f === "Todos"
                ? "bg-primary/15 text-primary border-primary/25"
                : "glass text-white/40 border-white/8 hover:text-white"
            }`}>
            {f}
          </span>
        ))}
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/5">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Usuario</span>
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider w-24 text-center">Cursos</span>
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider w-28 text-center">Rol</span>
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider w-16 text-center">Acción</span>
        </div>

        {profiles?.map((p, i) => {
          const badge = getRoleBadge(p);
          const name = p.full_name || "Sin nombre";
          const initial = name.charAt(0).toUpperCase();
          const courses = countMap[p.id] || 0;

          return (
            <div key={p.id}
              className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 ${
                i > 0 ? "border-t border-white/[0.04]" : ""
              } hover:bg-white/[0.02] transition-colors`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {new Date(p.created_at).toLocaleDateString("es-MX")}
                  </p>
                </div>
              </div>

              <div className="w-24 text-center">
                <span className="text-sm font-semibold text-white">{courses}</span>
                <span className="text-xs text-white/30 ml-1">curso{courses !== 1 ? "s" : ""}</span>
              </div>

              <div className="w-28 flex justify-center">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                  {badge.label}
                </span>
              </div>

              <div className="w-16 flex justify-center">
                <Link href={`/admin/usuarios/${p.id}`}
                  className="text-xs text-primary hover:underline">
                  Gestionar
                </Link>
              </div>
            </div>
          );
        })}

        {(!profiles || profiles.length === 0) && (
          <div className="px-5 py-10 text-center text-sm text-white/30">
            No hay usuarios registrados aún.
          </div>
        )}
      </div>
    </div>
  );
}
