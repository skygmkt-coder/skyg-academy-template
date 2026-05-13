"use client";

import { useActionState } from "react";
import { registerAction } from "./actions";

const initialState = {
  error: "",
};

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        action={formAction}
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

        {state?.error && (
          <p className="text-red-500 text-sm">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-black text-white p-3 rounded"
        >
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
