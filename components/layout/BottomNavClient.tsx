"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import type { NavUser } from "./Nav";

function NavIcon({ name, size }: { name: keyof typeof Icons; size: number }) {
  const I = Icons[name] as React.ComponentType<{ size: number }>;
  return <I size={size} />;
}

function getItems(user: NavUser) {
  if (!user) {
    return [
      { href: "/", label: "Inicio", icon: "home" as const },
      { href: "/#cursos", label: "Cursos", icon: "explore" as const },
      { href: "/tienda", label: "Tienda", icon: "store" as const },
      { href: "/login", label: "Entrar", icon: "login" as const },
    ];
  }

  const isAdmin = user.is_admin || user.is_super_admin;

  if (isAdmin) {
    return [
      { href: "/", label: "Inicio", icon: "home" as const },
      { href: "/dashboard", label: "Cursos", icon: "courses" as const },
      { href: "/tienda", label: "Tienda", icon: "store" as const },
      { href: "/admin", label: "Admin", icon: "shield" as const },
      ...(user.is_super_admin
        ? [{ href: "/admin/tema", label: "Tema", icon: "palette" as const }]
        : []),
    ];
  }

  return [
    { href: "/", label: "Inicio", icon: "home" as const },
    { href: "/#cursos", label: "Explorar", icon: "explore" as const },
    { href: "/dashboard", label: "Mis cursos", icon: "courses" as const },
    { href: "/tienda", label: "Tienda", icon: "store" as const },
  ];
}

export default function BottomNavClient({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const items = getItems(user);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/";
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  async function logout() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className="flex items-center px-3 py-2 gap-1"
        style={{
          background: "rgba(10,15,26,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "99px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {items.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 transition-all"
              style={{
                minWidth: 54,
                padding: "8px 6px",
                borderRadius: "99px",
                background: active ? "rgba(53,137,242,0.15)" : "transparent",
                color: active ? "var(--color-primary, #3589F2)" : "rgba(255,255,255,0.28)",
              }}
            >
              <span style={{
                transform: active ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.2s ease",
              }}>
                <NavIcon name={item.icon} size={20} />
              </span>
              <span style={{
                fontSize: 9,
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.02em",
                lineHeight: 1,
                color: active ? "var(--color-primary, #3589F2)" : "rgba(255,255,255,0.28)",
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Logout if logged in */}
        {user && (
          <>
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
            <button
              onClick={logout}
              className="flex flex-col items-center justify-center gap-1 transition-all"
              style={{
                minWidth: 48,
                padding: "8px 6px",
                borderRadius: "99px",
                color: "rgba(255,255,255,0.2)",
                background: "transparent",
              }}
            >
              <Icons.logout size={20} />
              <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.02em", lineHeight: 1 }}>
                Salir
              </span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
