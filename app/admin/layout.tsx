import { redirect } from "next/navigation";
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

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_admin, is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_super_admin) redirect("/dashboard");

  const isSuperAdmin = profile?.is_super_admin === true;
  const firstName = (profile?.full_name || user.email || "").split(" ")[0];

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "⚡", roles: ["admin", "super"] },
    { href: "/admin/cursos/nuevo", label: "Nuevo curso", icon: "➕", roles: ["admin", "super"] },
    { href: "/admin/usuarios", label: "Usuarios", icon: "👥", roles: ["admin", "super"] },
    { href: "/admin/clases-en-vivo", label: "Clases en vivo", icon: "🎥", roles: ["admin", "super"] },
    { href: "/admin/tema", label: "Tema y marca", icon: "🎨", roles: ["super"] },
  ];

  const visibleItems = navItems.filter(item =>
    isSuperAdmin ? true : item.roles.includes("admin")
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      {/* Sidebar */}
      <aside className="w-60 flex flex-col shrink-0 border-r border-white/5"
        style={{ background: "rgba(13,20,33,0.95)", backdropFilter: "blur(20px)" }}>

        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <Link href="/" className="font-display font-bold text-lg block">
            <span className="text-primary">SKYG</span>
            <span className="text-white"> Admin</span>
          </Link>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-white leading-none">{firstName}</p>
              <p className="text-[10px] mt-0.5" style={{ color: isSuperAdmin ? "#f59e0b" : "#8FA4C4" }}>
                {isSuperAdmin ? "⭐ Super Admin" : "Admin"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-3 py-2">
            Gestión
          </p>
          {visibleItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50
                hover:text-white hover:bg-white/5 transition-all border border-transparent
                hover:border-white/5 group">
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.roles.includes("super") && !item.roles.includes("admin") && (
                <span className="ml-auto text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">
                  SUPER
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <Link href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <span>🎓</span><span>Ver academia</span>
          </Link>
          <Link href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <span>🏠</span><span>Ir al inicio</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
