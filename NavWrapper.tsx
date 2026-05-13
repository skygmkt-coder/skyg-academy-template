"use client";

import { usePathname } from "next/navigation";

// Wrapper cliente que oculta el nav en rutas que tienen su propio layout
export default function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/admin") || pathname.startsWith("/learn");
  if (hidden) return null;
  return <>{children}</>;
}
