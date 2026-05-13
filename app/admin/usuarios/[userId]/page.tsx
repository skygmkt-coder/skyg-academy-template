import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { grantAccess, revokeAccess, deleteEnrollment, setRole } from "../actions";

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

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from("profiles").select("is_super_admin").eq("id", currentUser!.id).single();
  const isSuperAdmin = currentProfile?.is_super_admin === true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, is_admin, is_super_admin, created_at")
    .eq("id", userId).single();
  if (!profile) notFound();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, active, enrolled_at, courses(id, title, slug)")
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false });

  const { data: allCourses } = await supabase
    .from("courses").select("id, title, slug").eq("published", true);

  const enrolledCourseIds = new Set(
    enrollments?.filter(e => e.active).map((e: any) => e.courses?.id)
  );
  const unenrolledCourses = allCourses?.filter(c => !enrolledCourseIds.has(c.id)) || [];

  const currentRole = profile.is_super_admin ? "super_admin" : profile.is_admin ? "admin" : "alumno";
  const name = profile.full_name || "Sin nombre";

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/usuarios" className="text-sm text-white/40 hover:text-white">← Usuarios</Link>
        <span className="text-white/20">/</span>
        <h1 className="font-display text-xl font-bold text-white">{name}</h1>
      </div>

      {/* User card */}
      <div className="glass rounded-2xl p-5 border border-white/8 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-lg font-bold text-primary">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">{name}</p>
            <p className="text-xs text-white/30 mt-0.5">
              Registrado {new Date(profile.created_at).toLocaleDateString("es-MX")}
            </p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
            profile.is_super_admin
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
              : profile.is_admin
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                : "bg-white/5 text-white/40 border border-white/10"
          }`}>
            {profile.is_super_admin ? "⭐ Super Admin" : profile.is_admin ? "🛡 Admin" : "🎓 Alumno"}
          </span>
        </div>

        {/* Role change — only super admin can do this */}
        {isSuperAdmin && userId !== currentUser?.id && (
          <div className="mt-5 pt-5 border-t border-white/5">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
              Cambiar rol
            </p>
            <div className="flex gap-2">
              {(["alumno", "admin", "super_admin"] as const).map(role => (
                <form key={role}
                  action={async () => { "use server"; await setRole(userId, role); }}>
                  <button type="submit"
                    className={`text-xs px-4 py-2 rounded-lg font-medium transition-all border ${
                      currentRole === role
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-white/5 text-white/40 border-white/10 hover:text-white hover:border-white/20"
                    }`}>
                    {role === "alumno" ? "🎓 Alumno" : role === "admin" ? "🛡 Admin" : "⭐ Super Admin"}
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enrollments */}
      <h2 className="font-display text-sm font-bold text-white/50 uppercase tracking-wider mb-3">
        Acceso a cursos
      </h2>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden mb-4">
        {enrollments && enrollments.length > 0 ? enrollments.map((e: any, i: number) => (
          <div key={e.id}
            className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}>
            <div>
              <p className="text-sm font-medium text-white">{e.courses?.title}</p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {new Date(e.enrolled_at).toLocaleDateString("es-MX")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full ${
                e.active
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-white/5 text-white/30 border border-white/10"
              }`}>
                {e.active ? "Activo" : "Revocado"}
              </span>
              {e.active ? (
                <form action={async () => { "use server"; await revokeAccess(e.id, userId); }}>
                  <button type="submit"
                    className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors">
                    Revocar
                  </button>
                </form>
              ) : (
                <form action={async () => { "use server"; await grantAccess(userId, e.courses?.id); }}>
                  <button type="submit" className="text-xs text-primary hover:underline">Reactivar</button>
                </form>
              )}
              <form action={async () => { "use server"; await deleteEnrollment(e.id, userId); }}>
                <button type="submit"
                  onClick={(e) => { if (!confirm("¿Eliminar acceso permanentemente?")) e.preventDefault(); }}
                  className="text-xs text-accent/50 hover:text-accent transition-colors">
                  ×
                </button>
              </form>
            </div>
          </div>
        )) : (
          <div className="px-5 py-6 text-center text-sm text-white/30">
            Sin cursos asignados
          </div>
        )}
      </div>

      {/* Grant access */}
      {unenrolledCourses.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-white/5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            Dar acceso a curso
          </p>
          <div className="flex flex-col gap-2">
            {unenrolledCourses.map(course => (
              <form key={course.id}
                action={async () => { "use server"; await grantAccess(userId, course.id); }}
                className="flex items-center justify-between py-1">
                <span className="text-sm text-white/60">{course.title}</span>
                <button type="submit"
                  className="text-xs bg-primary/15 text-primary border border-primary/25 px-4 py-1.5 rounded-lg hover:bg-primary/25 transition-all">
                  Dar acceso
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
