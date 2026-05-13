"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavUser } from "./Nav";

export default function BottomNavClient({
  user,
}: {
  user: NavUser;
}) {
  const pathname = usePathname();

  const links = [
    {
      href: "/dashboard",
      label: "Inicio",
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
    <div
      className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-3 py-2 flex items-center gap-2 rounded-2xl"
      style={{
        background:
          "rgba(7,11,18,0.88)",
        backdropFilter: "blur(24px)",
        border:
          "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {links.map((link) => {
        const active =
          pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: active
                ? "rgba(53,137,242,0.15)"
                : "transparent",
              color: active
                ? "#fff"
                : "rgba(255,255,255,0.55)",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
