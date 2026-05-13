"use client";

import { Icons } from "@/components/ui/Icons";


import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavUser } from "./Nav";

// ── SERVER ACTION (logout) ────────────────────────────
import { useRouter } from "next/navigation";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function getGreetingEmoji(): string {
  const h = new Date().getHours();
  if (h < 12) return "☀️";
  if (h < 18) return "👋";
  return "🌙";
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

function getNavSections(user: NavUser): NavSection[] {
  if (!user) {
    return [
      {
        label: "Navegación",
        items: [
          { href: "/", label: "Inicio", icon: <Icons.home size={18} /> },
          { href: "/#cursos", label: "Cursos", icon: <Icons.explore size={18} /> },
          { href: "/#servicios", label: "Servicios", icon: <Icons.services size={18} /> },
        ],
      },
      {
        label: "Cuenta",
        items: [
          { href: "/login", label: "Iniciar sesión", icon: <Icons.login size={18} /> },
        ],
      },
    ];
  }

  const isAdmin = user.is_admin || user.is_super_admin;

  const sections: NavSection[] = [
    {
      label: "Principal",
      items: [
        { href: "/", label: "Inicio", icon: <Icons.home size={18} /> },
        { href: "/#cursos", label: "Explorar cursos", icon: <Icons.explore size={18} /> },
        { href: "/dashboard", label: "Mis cursos", icon: <Icons.courses size={18} /> },
      ],
    },
  ];

  if (isAdmin) {
    sections.push({
      label: "Administración",
      items: [
        { href: "/admin", label: "Panel admin", icon: <Icons.dashboard size={18} /> },
        { href: "/admin/cursos/nuevo", label: "Nuevo curso", icon: <Icons.courses size={18} /> },
        { href: "/admin/usuarios", label: "Usuarios", icon: <Icons.shield size={18} /> },
        { href: "/admin/clases-en-vivo", label: "Clases en vivo", icon: <Icons.live size={18} /> },
        ...(user.is_super_admin ? [
          { href: "/admin/tema", label: "Tema y marca", icon: <Icons.palette size={18} />, badge: "SUPER" as string | undefined },
        ] : []),
      ],
    });
  }

  return sections;
}

export default function SidebarClient({ user }: { user: NavUser }) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Persist collapsed state + sync CSS variable
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    const isExpanded = saved === "true";
    if (isExpanded) setExpanded(true);
    document.documentElement.style.setProperty(
      "--sidebar-w", isExpanded ? "240px" : "68px"
    );
  }, []);

  const toggle = () => {
    setExpanded(prev => {
      const next = !prev;
      localStorage.setItem("sidebar-expanded", String(next));
      // Update CSS variable so main content shifts correctly
      document.documentElement.style.setProperty(
        "--sidebar-w", next ? "240px" : "68px"
      );
      return next;
    });
  };

  const sections = getNavSections(user);
  const firstName = (user?.full_name || user?.email || "").split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("#")[0]) && href.split("#")[0] !== "/";
  };

  async function handleLogout() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const W = expanded ? 240 : 68;

  return (
    <>
      {/* Overlay when expanded on smaller desktop */}
      {expanded && (
        <div
          className="fixed inset-0 z-30 hidden md:block lg:hidden"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }}
          onClick={toggle}
        />
      )}

      <aside
        className="fixed top-0 left-0 bottom-0 z-40 hidden md:flex flex-col"
        style={{
          width: `${W}px`,
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
          background: "rgba(7,11,18,0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* ── USER SECTION ─────────────────────────── */}
        <div className="flex flex-col px-3 pt-5 pb-4 border-b border-white/5">
          {user ? (
            <div className={`flex items-center gap-3 ${expanded ? "" : "justify-center"}`}>
              <div
                className="shrink-0 rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  width: 38, height: 38,
                  background: "rgba(53,137,242,0.15)",
                  border: "2px solid rgba(53,137,242,0.3)",
                  color: "var(--color-primary, #3589F2)",
                }}
              >
                {initial}
              </div>
              {expanded && (
                <div className="min-w-0">
                  <p className="text-[10px] text-white/40 leading-none mb-0.5">
                    {getGreeting()} {getGreetingEmoji()}
                  </p>
                  <p className="text-sm font-bold text-white truncate leading-tight">
                    {firstName}
                  </p>
                  {user.is_super_admin && (
                    <p className="text-[10px] text-amber-400 mt-0.5 font-semibold">⭐ Super Admin</p>
                  )}
                  {user.is_admin && !user.is_super_admin && (
                    <p className="text-[10px] text-primary/70 mt-0.5">Admin</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={`flex items-center ${expanded ? "gap-3" : "justify-center"}`}>
              <div
                className="shrink-0 rounded-full flex items-center justify-center"
                style={{
                  width: 38, height: 38,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              {expanded && (
                <div>
                  <p className="text-sm font-bold text-white">SKYG Academy</p>
                  <p className="text-[10px] text-white/30">Sin sesión</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── NAV SECTIONS ─────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1">
          {sections.map((section) => (
            <div key={section.label} className="px-2">
              {expanded && (
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em] px-2 py-1.5">
                  {section.label}
                </p>
              )}
              {!expanded && <div className="h-3" />}
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    title={!expanded ? item.label : undefined}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-xl mb-0.5 transition-all duration-150 group relative"
                    style={{
                      background: active
                        ? "rgba(53,137,242,0.15)"
                        : "transparent",
                      border: active
                        ? "1px solid rgba(53,137,242,0.2)"
                        : "1px solid transparent",
                      justifyContent: expanded ? "flex-start" : "center",
                    }}
                  >
                    <span
                      className="shrink-0 transition-colors"
                      style={{ color: active ? "var(--color-primary, #3589F2)" : "rgba(255,255,255,0.35)" }}
                    >
                      {item.icon}
                    </span>
                    {expanded && (
                      <span
                        className="text-sm font-medium truncate transition-colors flex-1"
                        style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)" }}
                      >
                        {item.label}
                      </span>
                    )}
                    {expanded && item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 shrink-0">
                        {item.badge}
                      </span>
                    )}
                    {/* Tooltip when collapsed */}
                    {!expanded && (
                      <div
                        className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap
                          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                        style={{
                          background: "rgba(13,20,33,0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── BOTTOM: LOGOUT + TOGGLE ───────────────── */}
        <div className="px-2 py-3 border-t border-white/5 space-y-1">
          {user && (
            <button
              onClick={handleLogout}
              title={!expanded ? "Cerrar sesión" : undefined}
              className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all hover:bg-accent/10 group relative"
              style={{ justifyContent: expanded ? "flex-start" : "center" }}
            >
              <span className="shrink-0 text-white/25 group-hover:text-accent transition-colors">
                {<Icons.logout size={18} />}
              </span>
              {expanded && (
                <span className="text-sm text-white/30 group-hover:text-accent transition-colors font-medium">
                  Cerrar sesión
                </span>
              )}
              {!expanded && (
                <div
                  className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                  style={{
                    background: "rgba(13,20,33,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  Cerrar sesión
                </div>
              )}
            </button>
          )}

          {/* Collapse / Expand button */}
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all hover:bg-white/5 group"
            style={{ justifyContent: expanded ? "flex-start" : "center" }}
          >
            <span className="shrink-0 text-white/20 group-hover:text-white/50 transition-colors">
              {expanded ? <Icons.chevronLeft size={18} /> : <Icons.chevronRight size={18} />}
            </span>
            {expanded && (
              <span className="text-xs text-white/20 group-hover:text-white/40 transition-colors font-medium">
                Contraer menú
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
