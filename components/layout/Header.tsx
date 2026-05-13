import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signOutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ── SVG ICONS ─────────────────────────────────────────
const icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  explore: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  courses: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  ),
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  admin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <path d="M18 11l1.5 1.5L22 10"/>
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { full_name?: string; is_admin?: boolean; is_super_admin?: boolean } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, is_admin, is_super_admin")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const isAdmin = profile?.is_admin || profile?.is_super_admin || false;
  const isSuperAdmin = profile?.is_super_admin || false;
  const firstName = (profile?.full_name || user?.email || "").split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  // ── DESKTOP NAV ITEMS ───────────────────────────────
  const guestLinks = [
    { href: "/#cursos", label: "Cursos" },
    { href: "/#servicios", label: "Servicios" },
    { href: "/#faq", label: "FAQ" },
  ];

  const userLinks = [
    { href: "/", label: "Inicio" },
    { href: "/#cursos", label: "Explorar" },
    { href: "/dashboard", label: "Mis cursos" },
  ];

  const adminLinks = [
    { href: "/", label: "Inicio" },
    { href: "/#cursos", label: "Explorar" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/admin", label: isAdmin ? (isSuperAdmin ? "⭐ Admin" : "Admin") : "" },
  ];

  const navLinks = !user ? guestLinks : isAdmin ? adminLinks : userLinks;

  // ── MOBILE BOTTOM NAV ───────────────────────────────
  const guestMobile = [
    { href: "/", label: "Inicio", icon: icons.home },
    { href: "/#cursos", label: "Cursos", icon: icons.explore },
    { href: "/login", label: "Entrar", icon: icons.user },
  ];

  const userMobile = [
    { href: "/", label: "Inicio", icon: icons.home },
    { href: "/#cursos", label: "Explorar", icon: icons.explore },
    { href: "/dashboard", label: "Mis cursos", icon: icons.courses },
    { href: "/dashboard", label: "Perfil", icon: icons.user },
  ];

  const adminMobile = [
    { href: "/", label: "Inicio", icon: icons.home },
    { href: "/#cursos", label: "Explorar", icon: icons.explore },
    { href: "/dashboard", label: "Dashboard", icon: icons.dashboard },
    { href: "/admin", label: "Admin", icon: icons.admin },
  ];

  const mobileLinks = !user ? guestMobile : isAdmin ? adminMobile : userMobile;

  return (
    <>
      {/* ── DESKTOP TOP NAV ─────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 hidden md:flex glass border-b border-white/5"
        style={{ height: "62px" }}
      >
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-display font-bold text-lg tracking-tight shrink-0">
            <span className="text-primary">SKYG</span>
            <span className="text-white"> Academy</span>
          </Link>

          {/* Center links */}
          <div className="flex items-center gap-6">
            {navLinks.map(link => link.label && (
              <Link key={link.href + link.label} href={link.href}
                className={`text-sm font-medium transition-colors ${
                  link.label.includes("Admin")
                    ? "text-amber-400 hover:text-amber-300"
                    : "text-white/50 hover:text-white"
                }`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            {!user ? (
              <>
                <Link href="/login"
                  className="text-sm font-medium text-white/50 hover:text-white transition-colors px-3 py-2">
                  Iniciar sesión
                </Link>
                <Link href="/registro"
                  className="text-sm font-semibold bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full transition-all hover:shadow-glow">
                  Registrarse
                </Link>
              </>
            ) : (
              <>
                {/* Avatar */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                    {initial}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-white leading-none">{firstName}</p>
                    {isSuperAdmin && (
                      <p className="text-[10px] text-amber-400 mt-0.5">⭐ Super Admin</p>
                    )}
                    {isAdmin && !isSuperAdmin && (
                      <p className="text-[10px] text-primary/70 mt-0.5">Admin</p>
                    )}
                  </div>
                </div>

                {/* Logout */}
                <form action={signOutAction}>
                  <button type="submit"
                    className="flex items-center gap-1.5 text-xs text-white/30 hover:text-accent transition-colors px-2 py-1.5">
                    {icons.logout}
                    <span className="hidden lg:inline">Salir</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── MOBILE TOP BAR (logo only) ──────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex md:hidden items-center justify-between px-5 glass border-b border-white/5"
        style={{ height: "54px" }}
      >
        <Link href="/" className="font-display font-bold text-base">
          <span className="text-primary">SKYG</span>
          <span className="text-white"> Academy</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <span className="text-[10px] text-amber-400 font-bold">⭐ SUPER</span>
            )}
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
              {initial}
            </div>
          </div>
        ) : (
          <Link href="/login"
            className="text-xs font-semibold bg-primary text-white px-4 py-1.5 rounded-full">
            Entrar
          </Link>
        )}
      </div>

      {/* ── MOBILE BOTTOM NAV ───────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around px-2 pb-safe"
        style={{
          height: "68px",
          background: "rgba(7,11,18,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {mobileLinks.map((item, i) => {
          // Last item in user/admin nav = profile/logout
          const isProfileItem = user && i === mobileLinks.length - 1 && !isAdmin;

          if (isProfileItem) {
            return (
              <form key="logout" action={signOutAction} className="flex-1">
                <button type="submit" className="w-full flex flex-col items-center gap-1 py-2 text-white/30 hover:text-accent transition-colors">
                  <span className="flex items-center justify-center">{icons.user}</span>
                  <span className="text-[10px] font-medium">Salir</span>
                </button>
              </form>
            );
          }

          return (
            <Link key={item.href + item.label} href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-2 text-white/30 hover:text-primary transition-colors group">
              <span className="flex items-center justify-center group-hover:text-primary transition-colors">
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── SPACERS que empujan el contenido bajo los navs fijos ── */}
      {/* Desktop: espacio para top nav (62px) */}
      <div className="hidden md:block" style={{ height: "62px" }} />
      {/* Mobile: espacio para top bar (54px) */}
      <div className="md:hidden" style={{ height: "54px" }} />
    </>
  );
}
