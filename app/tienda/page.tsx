import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import CartButton from "@/components/cart/CartButton";
import AddToCartButton from "@/components/cart/AddToCartButton";

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

const TYPE_LABELS: Record<string, string> = {
  course: "Curso",
  digital: "Digital",
  physical: "Físico",
  service: "Servicio",
};

export default async function TiendaPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*, courses(slug)")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  const featured = products?.filter(p => p.featured) || [];
  const rest = products?.filter(p => !p.featured) || [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base, #070B12)" }}>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "var(--color-primary, #3589F2)" }}>
              Productos digitales y servicios
            </p>
            <h1 className="font-display text-4xl font-bold text-white">Tienda</h1>
          </div>
          <CartButton />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">

        {/* Featured */}
        {featured.length > 0 && (
          <section className="mb-14">
            <h2 className="font-display text-lg font-bold text-white mb-5">Destacados</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} featured />
              ))}
            </div>
          </section>
        )}

        {/* All products */}
        <section>
          {featured.length > 0 && (
            <h2 className="font-display text-lg font-bold text-white mb-5">Todos los productos</h2>
          )}
          {products && products.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {(featured.length > 0 ? rest : products).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-4xl mb-4">🛍</p>
              <p className="text-white font-semibold mb-2">Próximamente</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                La tienda se está preparando. Mientras tanto, explora nuestros cursos.
              </p>
              <Link href="/#cursos"
                className="inline-block mt-5 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all"
                style={{ background: "var(--color-primary, #3589F2)" }}>
                Ver cursos
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProductCard({ product, featured }: { product: any; featured?: boolean }) {
  const href = product.type === "course" && product.courses?.slug
    ? `/cursos/${product.courses.slug}`
    : null;

  const card = (
    <div className="rounded-2xl overflow-hidden group transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(53,137,242,0.3)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}>

      {/* Image */}
      <div style={{
        aspectRatio: featured ? "21/9" : "16/9",
        background: "linear-gradient(135deg, rgba(53,137,242,0.12), rgba(13,20,33,1))",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.title}
            className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontSize: featured ? 48 : 32 }}>
            {product.type === "course" ? "🎓" : product.type === "physical" ? "📦" : product.type === "service" ? "⚙️" : "💾"}
          </span>
        )}
        {product.featured && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "var(--color-primary, #3589F2)", color: "#fff" }}>
            Destacado
          </span>
        )}
        <span className="absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
          {TYPE_LABELS[product.type] || product.type}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: "16px 18px" }}>
        <h3 className="font-display font-bold text-white leading-tight mb-1.5"
          style={{ fontSize: featured ? 18 : 14 }}>
          {product.title}
        </h3>
        {product.description && (
          <p className="text-sm mb-4 line-clamp-2"
            style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-display font-bold"
            style={{ fontSize: featured ? 22 : 17, color: "#fff" }}>
            ${(product.price_cents / 100).toLocaleString()}
          </span>
          {product.stock !== null && product.stock <= 5 && product.stock > 0 && (
            <span className="text-xs font-medium"
              style={{ color: "var(--color-accent, #E8004A)" }}>
              Últimas {product.stock} unidades
            </span>
          )}
        </div>
        <div className="mt-3">
          <AddToCartButton
            productId={product.id}
            title={product.title}
            price={product.price_cents}
            type={product.type}
            courseHref={product.type === "course" && product.courses?.slug
              ? `/cursos/${product.courses.slug}` : null}
          />
        </div>
      </div>
    </div>
  );

  return href
    ? <Link href={href} className="block" style={{ textDecoration: "none" }}>{card}</Link>
    : card;
}
