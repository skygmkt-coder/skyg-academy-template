import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(c: any[]) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
      },
    }
  );
}

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, courses(title)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Tienda</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            {products?.length || 0} productos
          </p>
        </div>
        <Link href="/admin/tienda/nuevo"
          className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl"
          style={{ background: "var(--color-primary, #3589F2)", color: "#fff" }}>
          <Icons.plus size={16} />
          Nuevo producto
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="grid px-5 py-3 border-b text-[10px] font-bold text-white/25 uppercase tracking-wider"
          style={{ gridTemplateColumns: "1fr auto auto auto auto", borderColor: "rgba(255,255,255,0.05)" }}>
          <span>Producto</span>
          <span className="w-24 text-center">Tipo</span>
          <span className="w-24 text-center">Precio</span>
          <span className="w-20 text-center">Estado</span>
          <span className="w-16 text-center">Acción</span>
        </div>

        {products?.map((p, i) => (
          <div key={p.id}
            className="grid items-center px-5 py-4"
            style={{
              gridTemplateColumns: "1fr auto auto auto auto",
              borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>
            <div className="min-w-0 pr-4">
              <p className="text-sm font-semibold text-white truncate">{p.title}</p>
              {p.courses && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Curso: {p.courses.title}</p>}
            </div>
            <span className="w-24 text-center text-xs px-2 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
              {p.type}
            </span>
            <span className="w-24 text-center font-semibold text-white text-sm">
              ${(p.price_cents / 100).toLocaleString()}
            </span>
            <span className="w-20 flex justify-center">
              <span className="text-xs px-2 py-1 rounded-full"
                style={{
                  background: p.active ? "rgba(22,163,74,0.1)" : "rgba(255,255,255,0.05)",
                  color: p.active ? "#4ade80" : "rgba(255,255,255,0.3)",
                  border: p.active ? "1px solid rgba(22,163,74,0.2)" : "1px solid rgba(255,255,255,0.08)",
                }}>
                {p.active ? "Activo" : "Inactivo"}
              </span>
            </span>
            <div className="w-16 flex justify-center">
              <Link href={`/admin/tienda/${p.id}`} className="text-xs"
                style={{ color: "var(--color-primary, #3589F2)" }}>
                Editar
              </Link>
            </div>
          </div>
        ))}

        {(!products || products.length === 0) && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
            No hay productos. <Link href="/admin/tienda/nuevo" style={{ color: "var(--color-primary)" }}>Crear uno →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
