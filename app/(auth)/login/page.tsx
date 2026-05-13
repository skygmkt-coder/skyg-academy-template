"use client";

import Link from "next/link";
import PasswordInput from "@/components/ui/PasswordInput";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-bold text-2xl">
            <span className="text-primary">SKYG</span>
            <span className="text-white"> Academy</span>
          </Link>
          <p className="text-muted mt-2 text-sm">Inicia sesión en tu cuenta</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/10 shadow-card">
          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const email = (form.email as HTMLInputElement).value;
              const password = (form.password as HTMLInputElement).value;

              const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              });

              const data = await response.json();

              if (data.error) {
                alert(data.error);
                return;
              }

              window.location.href = "/dashboard";
            }}
          >
            <div>
              <label className="text-sm text-muted mb-2 block">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="tu@correo.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:outline-none focus:border-primary/50 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-2 block">
                Contraseña
              </label>
              <PasswordInput
                name="password"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all hover:shadow-glow"
            >
              Iniciar sesión
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-primary hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
