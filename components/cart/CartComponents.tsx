"use client";

// ═══════════════════════════════════════════════════════
// CART SYSTEM — localStorage, no DB required for MVP
// ═══════════════════════════════════════════════════════

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

// ── CART TYPES ─────────────────────────────────────────
export type CartItem = {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  type: string;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">) => void;
  remove: (productId: string) => void;
  clear: () => void;
  total: number;
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("skyg-cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem("skyg-cart", JSON.stringify(next));
  };

  const add = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const exists = prev.find(i => i.productId === item.productId);
      const next = exists
        ? prev.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...item, quantity: 1 }];
      localStorage.setItem("skyg-cart", JSON.stringify(next));
      return next;
    });
    setOpen(true);
  }, []);

  const remove = useCallback((productId: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.productId !== productId);
      localStorage.setItem("skyg-cart", JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    localStorage.removeItem("skyg-cart");
  }, []);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, clear, total, count, open, setOpen }}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("CartProvider missing");
  return ctx;
}

// ── CART BUTTON (floating icon with badge) ─────────────
export default function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button onClick={() => setOpen(true)}
      className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.6)",
      }}>
      <Icons.cart size={18} />
      <span className="text-sm font-medium">Carrito</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: "var(--color-primary, #3589F2)" }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── ADD TO CART BUTTON ─────────────────────────────────
export function AddToCartButton({
  productId, title, price, type, courseHref,
}: {
  productId: string;
  title: string;
  price: number;
  type: string;
  courseHref: string | null;
}) {
  const { add, items } = useCart();
  const inCart = items.some(i => i.productId === productId);

  if (type === "course" && courseHref) {
    return (
      <Link href={courseHref}
        className="block w-full text-center text-sm font-semibold py-2.5 rounded-xl transition-all"
        style={{ background: "var(--color-primary, #3589F2)", color: "#fff" }}>
        Ver curso
      </Link>
    );
  }

  return (
    <button
      onClick={() => add({ productId, title, price, type })}
      className="w-full text-sm font-semibold py-2.5 rounded-xl transition-all"
      style={{
        background: inCart ? "rgba(22,163,74,0.12)" : "var(--color-primary, #3589F2)",
        color: inCart ? "#4ade80" : "#fff",
        border: inCart ? "1px solid rgba(22,163,74,0.2)" : "none",
      }}>
      {inCart ? "✓ En el carrito" : "Agregar al carrito"}
    </button>
  );
}

// ── CART DRAWER ────────────────────────────────────────
function CartDrawer() {
  const { items, remove, clear, total, count, open, setOpen } = useCart();

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={() => setOpen(false)} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: "min(400px, 100vw)",
          background: "rgba(7,11,18,0.97)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h2 className="font-display font-bold text-white">Carrito</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {count} {count === 1 ? "producto" : "productos"}
            </p>
          </div>
          <button onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
            <Icons.close size={16} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Icons.cart size={32} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Tu carrito está vacío</p>
              <button onClick={() => setOpen(false)}
                className="text-sm font-medium px-4 py-2 rounded-xl"
                style={{ background: "rgba(53,137,242,0.1)", color: "var(--color-primary, #3589F2)" }}>
                Explorar tienda
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.productId}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ background: "rgba(53,137,242,0.1)" }}>
                  {item.type === "course" ? "🎓" : item.type === "physical" ? "📦" : "💾"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    ${(item.price / 100).toLocaleString()} × {item.quantity}
                  </p>
                </div>
                <button onClick={() => remove(item.productId)}
                  className="text-sm transition-colors shrink-0 px-1"
                  style={{ color: "rgba(232,0,74,0.4)" }}>
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Total</span>
              <span className="font-display text-xl font-bold text-white">
                ${(total / 100).toLocaleString()} MXN
              </span>
            </div>
            <button
              className="w-full font-semibold py-3.5 rounded-xl transition-all text-sm text-white"
              style={{ background: "var(--color-primary, #3589F2)" }}
              onClick={() => {
                // TODO: integrate with Stripe checkout
                alert("Integración con Stripe pendiente. Los productos se agregarán al checkout en la Fase de pagos.");
              }}>
              Proceder al pago
            </button>
            <button onClick={clear}
              className="w-full text-xs py-2 rounded-xl transition-colors"
              style={{ color: "rgba(255,255,255,0.2)" }}>
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}
