"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NavUser } from "./Nav";

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function TopNavClient({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);

  // Cerrar menu al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, []);

  // Bloquear scroll cuando el menu está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const firstName = user
    ? (user.full_name || user.email).split(" ")[0]
    : null;

  const navLinks = [
    { href: "/#cursos", label: "Cursos" },
    { href: "/#servicios", label: "Servicios" },
    { href: "/#faq", label: "FAQ" },
  ];

  async function handleLogout() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <>
      {/* ── DESKTOP + MOBILE TOP BAR ─────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          height: "62px",
          background: "rgba(7,11,18,0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-display font-bold text-lg tracking-tight shrink-0">
            <span style={{ color: "var(--color-primary, #3589F2)" }}>SKYG</span>
            <span className="text-white"> Academy</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                className="text-sm font-medium text-white/50 hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard"
                  className="text-sm font-medium text-white/50 hover:text-white transition-colors px-3 py-2">
                  Mi academia
                </Link>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: "rgba(53,137,242,0.15)",
                      border: "1px solid rgba(53,137,242,0.3)",
                      color: "var(--color-primary, #3589F2)"
                    }}>
                    {firstName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white/60">{firstName}</span>
                </div>
                <button onClick={handleLogout}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1.5">
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/login"
                  className="text-sm font-medium text-white/50 hover:text-white transition-colors px-4 py-2">
                  Iniciar sesión
                </Link>
                <Link href="/registro"
                  className="text-sm font-semibold text-white px-5 py-2 rounded-full transition-all"
                  style={{
                    background: "var(--color-primary, #3589F2)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                  Comenzar gratis
                </Link>
              </>
            )}
          </div>

          {/* Mobile: hamburger */}
          <button
            onClick={() => setOpen(v => !v)}
            className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl transition-all"
            style={{
              background: open ? "rgba(255,255,255,0.08)" : "transparent",
              color: "rgba(255,255,255,0.7)",
            }}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Spacer para empujar el contenido bajo el nav fijo */}
      <div style={{ height: "62px" }} />

      {/* ── MOBILE MENU OVERLAY ──────────────────────── */}
      <div
        className="fixed inset-0 z-40 md:hidden flex flex-col"
        style={{
          pointerEvents: open ? "auto" : "none",
          opacity: open ? 1 : 0,
          transition: "opacity 0.2s ease",
          background: "rgba(7,11,18,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          top: "62px",
        }}
      >
        <div
          style={{
            transform: open ? "translateY(0)" : "translateY(-12px)",
            transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
          className="flex flex-col h-full"
        >
          {/* User greeting */}
          {user && (
            <div className="px-6 pt-8 pb-6 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold"
                  style={{
                    background: "rgba(53,137,242,0.15)",
                    border: "2px solid rgba(53,137,242,0.3)",
                    color: "var(--color-primary, #3589F2)"
                  }}>
                  {firstName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white text-base">{firstName}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {user.is_super_admin ? "⭐ Super Admin" : user.is_admin ? "Admin" : "Alumno"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nav items */}
          <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navLinks.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-4 rounded-2xl text-base font-medium transition-all"
                style={{
                  color: "rgba(255,255,255,0.7)",
                  animationDelay: `${i * 0.05}s`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                }}
              >
                {l.label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}

            {user && (
              <>
                <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "12px 16px" }} />
                <Link href="/dashboard" onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-4 rounded-2xl text-base font-medium"
                  style={{ color: "var(--color-primary, #3589F2)" }}>
                  Mi academia →
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              </>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="px-4 pb-10 space-y-3">
            {!user ? (
              <>
                <Link href="/registro" onClick={() => setOpen(false)}
                  className="block w-full text-center font-semibold text-white py-4 rounded-2xl text-base"
                  style={{ background: "var(--color-primary, #3589F2)" }}>
                  Comenzar gratis
                </Link>
                <Link href="/login" onClick={() => setOpen(false)}
                  className="block w-full text-center font-medium py-4 rounded-2xl text-base"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.6)",
                  }}>
                  Ya tengo cuenta
                </Link>
              </>
            ) : (
              <button onClick={handleLogout}
                className="block w-full text-center font-medium py-4 rounded-2xl text-base"
                style={{
                  background: "rgba(232,0,74,0.08)",
                  border: "1px solid rgba(232,0,74,0.15)",
                  color: "var(--color-accent, #E8004A)",
                }}>
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
