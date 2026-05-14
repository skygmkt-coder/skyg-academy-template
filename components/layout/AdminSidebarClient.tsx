"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";

type AdminUser = {
  name: string;
  is_super_admin: boolean;
};

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" as const },
  { href: "/admin/cursos/nuevo", label: "Nuevo curso", icon: "plus" as const },
  { href: "/admin/usuarios", label: "Usuarios", icon: "users" as const },
  { href: "/admin/clases-en-vivo", label: "Clases en vivo", icon: "live" as const },
];

const SUPER_ONLY = [
  { href: "/admin/tema", label: "Tema y marca", icon: "palette" as const, badge: "SUPER" },
];

const BOTTOM = [
  { href: "/dashboard", label: "Academia", icon: "courses" as const },
  { href: "/", label: "Inicio", icon: "home" as const },
];

function NavIcon({ name, size }: { name: keyof typeof Icons; size: number }) {
  const I = Icons[name] as React.ComponentType<{ size: number }>;
  return <I size={size} />;
}

export default function AdminSidebarClient({ user }: { user: AdminUser }) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-expanded");
    const isExp = saved === "true";
    if (isExp) setExpanded(true);
    document.documentElement.style.setProperty("--admin-sidebar-w", isExp ? "220px" : "64px");
  }, []);

  const toggle = () => {
    setExpanded(prev => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-expanded", String(next));
      document.documentElement.style.setProperty("--admin-sidebar-w", next ? "220px" : "64px");
      return next;
    });
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function logout() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const allNav = [...NAV, ...(user.is_super_admin ? SUPER_ONLY : [])];
  const W = expanded ? 220 : 64;

  return (
    <>
      {/* ── DESKTOP SIDEBAR ────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-40"
        style={{
          width: W,
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
          background: "rgba(7,11,18,0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <div className="flex flex-col px-3 pt-5 pb-4 border-b border-white/5">
          <div className={`flex items-center gap-2.5 ${expanded ? "" : "justify-center"}`}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{
                background: "rgba(53,137,242,0.15)",
                border: "2px solid rgba(53,137,242,0.3)",
                color: "var(--color-primary, #3589F2)",
              }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            {expanded && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] font-semibold mt-0.5"
                  style={{ color: user.is_super_admin ? "#f59e0b" : "rgba(255,255,255,0.4)" }}>
                  {user.is_super_admin ? "⭐ Super Admin" : "Admin"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {!expanded && <div className="h-2" />}
          {expanded && (
            <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-2 py-2">
              Gestión
            </p>
          )}
          {allNav.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                title={!expanded ? item.label : undefined}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all group relative"
                style={{
                  justifyContent: expanded ? "flex-start" : "center",
                  background: active ? "rgba(53,137,242,0.12)" : "transparent",
                  border: active ? "1px solid rgba(53,137,242,0.2)" : "1px solid transparent",
                  color: active ? "var(--color-primary, #3589F2)" : "rgba(255,255,255,0.35)",
                }}>
                <span className="shrink-0">
                  <NavIcon name={item.icon} size={18} />
                </span>
                {expanded && (
                  <>
                    <span className="text-sm font-medium flex-1"
                      style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)" }}>
                      {item.label}
                    </span>
                    {"badge" in item && item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {!expanded && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                    style={{ background: "rgba(13,20,33,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-white/5 space-y-0.5">
          {BOTTOM.map(item => (
            <Link key={item.href} href={item.href}
              title={!expanded ? item.label : undefined}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all hover:bg-white/5 group relative"
              style={{ justifyContent: expanded ? "flex-start" : "center", color: "rgba(255,255,255,0.25)" }}>
              <span className="shrink-0"><NavIcon name={item.icon} size={18} /></span>
              {expanded && <span className="text-sm font-medium text-white/30">{item.label}</span>}
              {!expanded && (
                <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap
                  opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                  style={{ background: "rgba(13,20,33,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {item.label}
                </div>
              )}
            </Link>
          ))}
          <button onClick={logout}
            title={!expanded ? "Salir" : undefined}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all hover:bg-accent/10 group relative"
            style={{ justifyContent: expanded ? "flex-start" : "center", color: "rgba(255,255,255,0.2)" }}>
            <span className="shrink-0 group-hover:text-accent transition-colors"><Icons.logout size={18} /></span>
            {expanded && <span className="text-sm font-medium text-white/25 group-hover:text-accent transition-colors">Cerrar sesión</span>}
          </button>
          {/* Toggle */}
          <button onClick={toggle}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all hover:bg-white/5 group"
            style={{ justifyContent: expanded ? "flex-start" : "center", color: "rgba(255,255,255,0.15)" }}>
            <span className="shrink-0 group-hover:text-white/40 transition-colors">
              {expanded ? <Icons.chevronLeft size={16} /> : <Icons.chevronRight size={16} />}
            </span>
            {expanded && <span className="text-xs text-white/20 group-hover:text-white/40">Contraer</span>}
          </button>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ──────────────────── */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center px-2 py-2 gap-1"
          style={{
            background: "rgba(13,20,33,0.9)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "99px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
          {/* Home always visible */}
        <Link href="/"
          className="flex items-center justify-center transition-all"
          style={{ width: 48, height: 48, borderRadius: "99px", color: "rgba(255,255,255,0.3)" }}>
          <Icons.home size={20} />
        </Link>
        <Link href="/tienda"
          className="flex items-center justify-center transition-all"
          style={{ width: 48, height: 48, borderRadius: "99px", color: "rgba(255,255,255,0.3)" }}>
          <Icons.store size={20} />
        </Link>
        {allNav.slice(0, 3).map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center justify-center transition-all"
                style={{
                  width: 48, height: 48, borderRadius: "99px",
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "var(--color-primary, #3589F2)" : "rgba(255,255,255,0.3)",
                }}>
                <NavIcon name={item.icon} size={20} />
              </Link>
            );
          })}
          <button onClick={logout}
            className="flex items-center justify-center transition-all"
            style={{ width: 48, height: 48, borderRadius: "99px", color: "rgba(255,255,255,0.2)" }}>
            <Icons.logout size={20} />
          </button>
        </div>
      </nav>
    </>
  );
}
