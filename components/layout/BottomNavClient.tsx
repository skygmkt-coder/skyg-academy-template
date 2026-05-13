"use client";

import { Icons } from "@/components/ui/Icons";


import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import type { NavUser } from "./Nav";

interface PillItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  isAction?: boolean;
}


function getItems(user: NavUser): PillItem[] {
  if (!user) {
    return [
      { href: "/", label: "Inicio", icon: <Icons.home size={22} /> },
      { href: "/#cursos", label: "Cursos", icon: <Icons.explore size={22} /> },
      { href: "/login", label: "Entrar", icon: <Icons.user size={22} /> },
    ];
  }

  const isAdmin = user.is_admin || user.is_super_admin;

  if (isAdmin) {
    return [
      { href: "/", label: "Inicio", icon: <Icons.home size={22} /> },
      { href: "/#cursos", label: "Explorar", icon: <Icons.explore size={22} /> },
      { href: "/dashboard", label: "Cursos", icon: <Icons.courses size={22} /> },
      { href: "/admin", label: "Admin", icon: <Icons.shield size={22} /> },
      { href: "#logout", label: "Salir", icon: <Icons.logout size={22} />, isAction: true },
    ];
  }

  return [
    { href: "/", label: "Inicio", icon: <Icons.home size={22} /> },
    { href: "/#cursos", label: "Explorar", icon: <Icons.explore size={22} /> },
    { href: "/dashboard", label: "Mis cursos", icon: <Icons.courses size={22} /> },
    { href: "#logout", label: "Salir", icon: <Icons.logout size={22} />, isAction: true },
  ];
}

export default function BottomNavClient({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const items = getItems(user);

  const isActive = (href: string) => {
    if (href.startsWith("#")) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex md:hidden"
      style={{
        // Safe area for iPhone home indicator
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Outer pill */}
      <div
        className="flex items-center px-2 py-2 gap-1"
        style={{
          background: "rgba(13,20,33,0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "99px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {items.map((item) => {
          const active = isActive(item.href);

          if (item.isAction) {
            return (
              <button
                key="logout"
                onClick={handleLogout}
                className="flex flex-col items-center justify-center transition-all"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "99px",
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                <span className="flex items-center justify-center" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {item.icon}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex flex-col items-center justify-center transition-all duration-200"
              style={{
                width: 52,
                height: 52,
                borderRadius: "99px",
                background: active ? "rgba(255,255,255,0.1)" : "transparent",
                color: active
                  ? "var(--color-primary, #3589F2)"
                  : "rgba(255,255,255,0.3)",
              }}
            >
              <span
                className="flex items-center justify-center transition-all"
                style={{
                  color: active
                    ? "var(--color-primary, #3589F2)"
                    : "rgba(255,255,255,0.3)",
                  transform: active ? "scale(1.1)" : "scale(1)",
                }}
              >
                {item.icon}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
