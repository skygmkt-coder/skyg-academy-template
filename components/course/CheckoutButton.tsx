"use client";
import { useState } from "react";

export default function CheckoutButton({ courseId, price }: { courseId: string; price: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const { url, error: e } = await res.json();
      if (e) throw new Error(e);
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || "Error al procesar el pago");
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="text-accent text-xs mb-3">{error}</p>}
      <button onClick={handleCheckout} disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-all hover:shadow-glow">
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Procesando...</>
        ) : (
          <>Comprar ahora — ${price.toLocaleString()}</>
        )}
      </button>
    </div>
  );
}
