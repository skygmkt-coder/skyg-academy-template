import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CartButton from "@/components/cart/CartButton";
import AddToCartButton from "@/components/cart/AddToCartButton";

const TYPE_LABELS: Record<string,string> = { course:"Curso", digital:"Digital", physical:"Físico", service:"Servicio" };

export default async function TiendaPage() {
  const supabase = await createClient();

  // Safe query - products table may not exist
  let products: any[] = [];
  try {
    const { data } = await supabase
      .from("products").select("*, courses(slug)")
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    products = data || [];
  } catch { /* table not yet created */ }

  const featured = products.filter(p => p.featured);
  const rest = products.filter(p => !p.featured);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base,#070B12)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary,#3589F2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Productos y servicios
            </p>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "var(--font-display,Sora,sans-serif)" }}>Tienda</h1>
          </div>
          <CartButton />
        </div>

        {featured.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 16px 0" }}>Destacados</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
              {featured.map(p => <ProductCard key={p.id} product={p} featured />)}
            </div>
          </section>
        )}

        {products.length > 0 ? (
          <section>
            {featured.length > 0 && <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 16px 0" }}>Todos los productos</h2>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
              {(featured.length > 0 ? rest : products).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24 }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🛍</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 8px 0" }}>Próximamente</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 24px 0" }}>
              La tienda está en preparación. Explora nuestros cursos mientras tanto.
            </p>
            <Link href="/#cursos" style={{ padding: "12px 28px", borderRadius: 99, fontSize: 14, fontWeight: 700, background: "var(--color-primary,#3589F2)", color: "#fff", textDecoration: "none", display: "inline-block" }}>
              Ver cursos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, featured }: { product: any; featured?: boolean }) {
  const href = product.type === "course" && product.courses?.slug ? `/cursos/${product.courses.slug}` : null;

  const card = (
    <div style={{ borderRadius: 18, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", transition: "all 0.2s", cursor: "pointer" }}>
      <div style={{ aspectRatio: featured ? "21/9" : "16/9", background: product.image_url ? `url(${product.image_url}) center/cover` : "linear-gradient(135deg,rgba(53,137,242,0.12),rgba(13,20,33,1))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {!product.image_url && <span style={{ fontSize: featured ? 48 : 32 }}>
          {product.type === "course" ? "🎓" : product.type === "physical" ? "📦" : product.type === "service" ? "⚙️" : "💾"}
        </span>}
        {product.featured && (
          <span style={{ position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "var(--color-primary,#3589F2)", color: "#fff" }}>Destacado</span>
        )}
        <span style={{ position: "absolute", top: 10, right: 10, fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)" }}>
          {TYPE_LABELS[product.type] || product.type}
        </span>
      </div>
      <div style={{ padding: "16px 18px" }}>
        <h3 style={{ fontSize: featured ? 17 : 14, fontWeight: 700, color: "#fff", margin: "0 0 6px 0", lineHeight: 1.3 }}>{product.title}</h3>
        {product.description && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 12px 0", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>{product.description}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: featured ? 22 : 17, fontWeight: 800, color: "#fff" }}>${(product.price_cents/100).toLocaleString()}</span>
          {product.stock !== null && product.stock <= 5 && product.stock > 0 && (
            <span style={{ fontSize: 11, color: "var(--color-accent,#E8004A)" }}>Últimas {product.stock}</span>
          )}
        </div>
        <AddToCartButton productId={product.id} title={product.title} price={product.price_cents} type={product.type} courseHref={product.type === "course" && product.courses?.slug ? `/cursos/${product.courses.slug}` : null} />
      </div>
    </div>
  );

  return href ? <Link href={href} style={{ textDecoration: "none", display: "block" }}>{card}</Link> : card;
}
