"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { NavUser } from "./Nav";
import SidebarClient from "./SidebarClient";
import BottomNavClient from "./BottomNavClient";

const SKIP = ["/admin", "/learn"];

export default function NavController({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const skip = SKIP.some(p => pathname.startsWith(p));

  // Sync body padding with sidebar width (desktop only)
  useEffect(() => {
    if (skip) {
      document.body.style.paddingLeft = "0px";
      document.body.style.paddingBottom = "0px";
      return;
    }

    const sync = () => {
      if (window.innerWidth >= 768) {
        const w = getComputedStyle(document.documentElement)
          .getPropertyValue("--sidebar-w").trim() || "64px";
        document.body.style.paddingLeft = w;
        document.body.style.paddingBottom = "0px";
      } else {
        document.body.style.paddingLeft = "0px";
        document.body.style.paddingBottom = "80px";
      }
    };

    // Listen for sidebar toggle (CSS var change)
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true, attributeFilter: ["style"],
    });

    sync();
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [skip, pathname]);

  if (skip) return null;

  return (
    <>
      <SidebarClient user={user} />
      <BottomNavClient user={user} />
    </>
  );
}
