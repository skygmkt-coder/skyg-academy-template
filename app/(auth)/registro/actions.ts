"use client";

import { signUp } from "./actions";

export default function RegistroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        action={signUp}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <input
          type="text"
          name="full_name"
          placeholder="Nombre"
          className="border p-3 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Correo"
          className="border p-3 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          className="border p-3 rounded"
        />

        <button
          type="submit"
          className="bg-black text-white p-3 rounded"
        >
          Crear cuenta
        </button>
      </form>
    </div>
  );
}
