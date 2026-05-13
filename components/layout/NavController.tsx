"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { NavUser } from "./Nav";
import TopNavClient from "./TopNavClient";
import SidebarClient from "./SidebarClient";
import BottomNavClient from "./BottomNavClient";

// Rutas con su propio layout (sin nav global)
const NO_NAV = ["/admin", "/learn"];

// Rutas de marketing → top bar + hamburger
const MARKETING = ["/", "/cursos", "/login", "/registro", "/auth"];

function isMarketing(pathname: string) {
  if (pathname === "/") return true;
  return MARKETING.some(p => p !== "/" && pathname.startsWith(p));
}

export default function NavController({ user }: { user: NavUser }) {
  const pathname = usePathname();

  // Rutas sin nav
  const noNav = NO_NAV.some(p => pathname.startsWith(p));

  // Tipo de nav
  const marketing = isMarketing(pathname);

  // Aplica padding al body según el tipo de nav
  useEffect(() => {
    if (noNav) {
      document.body.style.paddingLeft = "0px";
      document.body.style.paddingBottom = "0px";
    } else if (marketing) {
      document.body.style.paddingLeft = "0px";
      document.body.style.paddingBottom = "0px";
    } else {
      // App pages: sidebar offset en desktop
      const applyPadding = () => {
        if (window.innerWidth >= 768) {
          document.body.style.paddingLeft = "68px";
          document.body.style.paddingBottom = "0px";
        } else {
          document.body.style.paddingLeft = "0px";
          document.body.style.paddingBottom = "90px";
        }
      };
      applyPadding();
      window.addEventListener("resize", applyPadding);
      return () => window.removeEventListener("resize", applyPadding);
    }
  }, [noNav, marketing, pathname]);

  if (noNav) return null;

  if (marketing) {
    return <TopNavClient user={user} />;
  }

  // App pages → sidebar + pill
  return (
    <>
      <SidebarClient user={user} />
      <BottomNavClient user={user} />
    </>
  );
}
