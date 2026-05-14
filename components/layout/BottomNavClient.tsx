"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import type { NavUser } from "./Nav";

function NavIcon({ name, size }: { name: keyof typeof Icons; size: number }) {
  const I = Icons[name] as React.ComponentType<{ size: number }>;
  return <I size={size} />;
}

type PillItem = {
  href: string;
  label: string;
  icon: keyof typeof Icons;
  highlight?: boolean;
  isAction?: boolean;
};

function getItems(user: NavUser): PillItem[] {
  if (!user) {
    return [
      { href: "/", label: "Inicio", icon: "home" },
      { href: "/#cursos", label: "Cursos", icon: "explore" },
      { href: "/tienda", label: "Tienda", icon: "store" },
      { href: "/login", label: "Entrar", icon: "user" },
      { href: "/registro", label: "Gratis", icon: "plus", highlight: true },
    ];
  }

  if (user.is_admin || user.is_super_admin) {
    return [
      { href: "/", label: "Inicio", icon: "home" },
      { href: "/dashboard", label: "Cursos", icon: "courses" },
      { href: "/tienda", label: "Tienda", icon: "store" },
      { href: "/admin", label: "Admin", icon: "shield" },
      { href: "#logout", label: "Salir", icon: "logout", isAction: true },
    ];
  }

  return [
    { href: "/", label: "Inicio", icon: "home" },
    { href: "/#cursos", label: "Explorar", icon: "explore" },
    { href: "/dashboard", label: "Mis cursos", icon: "courses" },
    { href: "/tienda", label: "Tienda", icon: "store" },
    { href: "#logout", label: "Salir", icon: "logout", isAction: true },
  ];
}

export default function BottomNavClient({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = getItems(user);

  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  async function logout() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center px-2 py-2 gap-0.5"
        style={{
          background: "rgba(10,15,26,0.93)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "99px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
        }}>
        {items.map((item) => {
          const active = isActive(item.href);

          if (item.isAction) {
            return (
              <button key="action" onClick={logout}
                className="flex flex-col items-center justify-center gap-1"
                style={{ minWidth: 52, padding: "8px 6px", borderRadius: "99px", color: "rgba(255,255,255,0.2)" }}>
                <NavIcon name={item.icon} size={20} />
                <span style={{ fontSize: 9, fontWeight: 500, lineHeight: 1 }}>{item.label}</span>
              </button>
            );
          }

          if (item.highlight) {
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center justify-center gap-1"
                style={{
                  minWidth: 52, padding: "8px 6px", borderRadius: "99px",
                  background: "var(--color-primary, #3589F2)", color: "#fff",
                }}>
                <NavIcon name={item.icon} size={18} />
                <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1 }}>{item.label}</span>
              </Link>
            );
          }

          return (
            <Link key={item.href + item.label} href={item.href}
              className="flex flex-col items-center justify-center gap-1 transition-all"
              style={{
                minWidth: 52, padding: "8px 6px", borderRadius: "99px",
                background: active ? "rgba(53,137,242,0.15)" : "transparent",
                color: active ? "var(--color-primary, #3589F2)" : "rgba(255,255,255,0.28)",
              }}>
              <span style={{ transform: active ? "scale(1.1)" : "scale(1)", transition: "transform 0.2s" }}>
                <NavIcon name={item.icon} size={20} />
              </span>
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, lineHeight: 1,
                color: active ? "var(--color-primary, #3589F2)" : "rgba(255,255,255,0.28)" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
