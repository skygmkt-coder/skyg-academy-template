"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { NavUser } from "./Nav";

export default function SidebarClient({
  user,
}: {
  user: NavUser;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(
      "sidebar-collapsed"
    );

    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sidebar-collapsed",
      String(collapsed)
    );
  }, [collapsed]);

  const links = [
    {
      href: "/dashboard",
      label: "Dashboard",
    },
    {
      href: "/cursos",
      label: "Cursos",
    },
  ];

  if (user?.is_admin || user?.is_super_admin) {
    links.push({
      href: "/admin",
      label: "Admin",
    });
  }

  return (
    <aside
      className="hidden md:flex fixed top-0 left-0 h-screen z-50 flex-col transition-all duration-300"
      style={{
        width: collapsed ? "68px" : "240px",
        background:
          "rgba(7,11,18,0.82)",
        backdropFilter: "blur(24px)",
        borderRight:
          "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="h-16 flex items-center justify-between px-4">
        {!collapsed && (
          <span className="font-bold text-white">
            SKYG
          </span>
        )}

        <button
          onClick={() =>
            setCollapsed(!collapsed)
          }
          className="text-white/50 hover:text-white"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2">
        {links.map((link) => {
          const active =
            pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all"
              style={{
                background: active
                  ? "rgba(53,137,242,0.15)"
                  : "transparent",
                color: active
                  ? "#fff"
                  : "rgba(255,255,255,0.55)",
              }}
            >
              <div className="w-5 h-5 rounded-full bg-white/10 shrink-0" />

              {!collapsed && (
                <span className="text-sm font-medium">
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
