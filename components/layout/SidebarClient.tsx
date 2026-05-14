"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import type { NavUser } from "./Nav";

function getSections(user: NavUser) {
  if (!user) {
    return [
      {
        label: "",
        items: [
          { href: "/", label: "Inicio", icon: "home" as const },
          { href: "/#cursos", label: "Cursos", icon: "explore" as const },
          { href: "/tienda", label: "Tienda", icon: "store" as const },
        ],
      },
      {
        label: "Cuenta",
        items: [
          { href: "/login", label: "Iniciar sesión", icon: "login" as const },
          { href: "/registro", label: "Registrarse", icon: "user" as const },
        ],
      },
    ];
  }

  const isAdmin = user.is_admin || user.is_super_admin;

  const base = [{
    label: "Principal",
    items: [
      { href: "/", label: "Inicio", icon: "home" as const },
      { href: "/#cursos", label: "Explorar", icon: "explore" as const },
      { href: "/dashboard", label: "Mis cursos", icon: "courses" as const },
      { href: "/tienda", label: "Tienda", icon: "store" as const },
    ],
  }];

  if (!isAdmin) return base;

  return [
    ...base,
    {
      label: "Administración",
      items: [
        { href: "/admin", label: "Panel admin", icon: "dashboard" as const },
        { href: "/admin/usuarios", label: "Usuarios", icon: "users" as const },
        { href: "/admin/clases-en-vivo", label: "Clases en vivo", icon: "live" as const },
        ...(user.is_super_admin
          ? [{ href: "/admin/tema", label: "Tema y marca", icon: "palette" as const, badge: "SUPER" }]
          : []),
      ],
    },
  ];
}

function NavIcon({ name, size }: { name: keyof typeof Icons; size: number }) {
  const I = Icons[name] as React.ComponentType<{ size: number }>;
  return <I size={size} />;
}

export default function SidebarClient({ user }: { user: NavUser }) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    const isExp = saved === "true";
    if (isExp) setExpanded(true);
    document.documentElement.style.setProperty("--sidebar-w", isExp ? "220px" : "64px");
  }, []);

  const toggle = () => {
    setExpanded(prev => {
      const next = !prev;
      localStorage.setItem("sidebar-expanded", String(next));
      document.documentElement.style.setProperty("--sidebar-w", next ? "220px" : "64px");
      return next;
    });
  };

  const isActive = (href: string) => {
    // Anchor links (/#cursos) are NEVER marked as active
    if (href.includes("#")) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  async function logout() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const sections = getSections(user);
  const name = user ? (user.full_name || user.email).split(" ")[0] : "SKYG";
  const initial = name.charAt(0).toUpperCase();
  const W = expanded ? 220 : 64;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "☀️ Buenos días" : hour < 18 ? "👋 Buenas tardes" : "🌙 Buenas noches";

  return (
    <aside
      className="fixed top-0 left-0 bottom-0 z-40 hidden md:flex flex-col"
      style={{
        width: W,
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        background: "rgba(7,11,18,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* User/Brand */}
      <div className="px-3 pt-5 pb-4 border-b border-white/5">
        <div className={`flex items-center gap-2.5 ${expanded ? "" : "justify-center"}`}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background: user ? "rgba(53,137,242,0.15)" : "rgba(53,137,242,0.1)",
              border: `2px solid ${user ? "rgba(53,137,242,0.3)" : "rgba(53,137,242,0.15)"}`,
              color: "var(--color-primary, #3589F2)",
            }}>
            {initial}
          </div>
          {expanded && (
            <div className="min-w-0">
              {user ? (
                <>
                  <p className="text-[10px] text-white/30 leading-none mb-0.5">{greeting}</p>
                  <p className="text-sm font-bold text-white truncate leading-tight">{name}</p>
                  {user.is_super_admin && <p className="text-[10px] text-amber-400 font-semibold mt-0.5">⭐ Super Admin</p>}
                  {user.is_admin && !user.is_super_admin && <p className="text-[10px] mt-0.5" style={{ color: "var(--color-primary)" }}>Admin</p>}
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-white">SKYG Academy</p>
                  <p className="text-[10px] text-white/25">Bienvenido</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-2" : ""}>
            {expanded && section.label && (
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-2 py-1.5">
                {section.label}
              </p>
            )}
            {!expanded && si > 0 && (
              <div className="h-px mx-3 my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href + item.label} href={item.href}
                    title={!expanded ? item.label : undefined}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all group relative"
                    style={{
                      justifyContent: expanded ? "flex-start" : "center",
                      background: active ? "rgba(53,137,242,0.12)" : "transparent",
                      border: active ? "1px solid rgba(53,137,242,0.2)" : "1px solid transparent",
                    }}>
                    <span className="shrink-0 transition-colors"
                      style={{ color: active ? "var(--color-primary, #3589F2)" : "rgba(255,255,255,0.3)" }}>
                      <NavIcon name={item.icon} size={18} />
                    </span>
                    {expanded && (
                      <>
                        <span className="text-sm font-medium flex-1"
                          style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)" }}>
                          {item.label}
                        </span>
                        {"badge" in item && item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {!expanded && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap
                        opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                        style={{ background: "rgba(13,20,33,0.98)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-white/5 space-y-0.5">
        {user && (
          <button onClick={logout} title={!expanded ? "Cerrar sesión" : undefined}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all hover:bg-accent/10 group relative"
            style={{ justifyContent: expanded ? "flex-start" : "center" }}>
            <span className="shrink-0 text-white/20 group-hover:text-accent transition-colors"><Icons.logout size={18} /></span>
            {expanded && <span className="text-sm font-medium text-white/25 group-hover:text-accent transition-colors">Cerrar sesión</span>}
            {!expanded && (
              <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap
                opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                style={{ background: "rgba(13,20,33,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Cerrar sesión
              </div>
            )}
          </button>
        )}
        <button onClick={toggle}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all group"
          style={{ justifyContent: expanded ? "flex-start" : "center" }}>
          <span className="text-white/15 group-hover:text-white/35 transition-colors">
            {expanded ? <Icons.chevronLeft size={16} /> : <Icons.chevronRight size={16} />}
          </span>
          {expanded && <span className="text-xs text-white/15 group-hover:text-white/35">Contraer</span>}
        </button>
      </div>
    </aside>
  );
}
