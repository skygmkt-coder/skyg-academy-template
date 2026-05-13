"use client";

import { usePathname } from "next/navigation";

interface NavWrapperProps {
  nav: React.ReactNode;
  children: React.ReactNode;
}

// Rutas que tienen su propio layout completo (sin nav global)
const EXCLUDED = ["/admin", "/learn"];

export default function NavWrapper({ nav, children }: NavWrapperProps) {
  const pathname = usePathname();
  const excluded = EXCLUDED.some(p => pathname.startsWith(p));

  if (excluded) {
    return <>{children}</>;
  }

  return (
    <>
      {nav}
      <div
        className="min-h-screen"
        style={{ paddingLeft: "var(--sidebar-offset, 0px)" }}
      >
        {children}
      </div>
      <style>{`
        @media (min-width: 768px) { :root { --sidebar-offset: 68px; } }
        @media (max-width: 767px) { :root { --sidebar-offset: 0px; } }
      `}</style>
    </>
  );
}
