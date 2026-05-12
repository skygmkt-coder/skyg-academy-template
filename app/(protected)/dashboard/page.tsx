import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll(){ return cookieStore.getAll() }, setAll(c){ try{ c.forEach(({name,value,options})=>cookieStore.set(name,value,options))}catch{} } } }
  );
}

// Mock courses catalog for display
const CATALOG = [
  { id:"1", slug:"fotografia-profesional", title:"Fotografía Profesional", level:"Principiante", duration:"12 hrs", price:1299, tag:"Más vendido" },
  { id:"2", slug:"edicion-video-premiere", title:"Edición de Video", level:"Intermedio", duration:"9 hrs", price:999, tag:"Nuevo" },
  { id:"3", slug:"identidad-de-marca", title:"Identidad de Marca", level:"Avanzado", duration:"15 hrs", price:1499, tag:"" },
  { id:"4", slug:"instagram-profesional", title:"Instagram Profesional", level:"Principiante", duration:"6 hrs", price:799, tag:"Popular" },
];

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, is_admin").eq("id", user.id).single();
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("enrolled_at, courses(id, slug, title, description)")
    .eq("user_id", user.id).eq("active", true)
    .order("enrolled_at", { ascending: false });

  const firstName = (profile?.full_name || user.email || "").split(" ")[0];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Top nav */}
      <nav className="glass border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-lg">
            <span className="text-primary">SKYG</span><span className="text-white"> Academy</span>
          </Link>
          <div className="flex items-center gap-4">
            {profile?.is_admin && (
              <Link href="/admin" className="text-xs text-muted hover:text-primary transition-colors">Admin</Link>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-semibold text-primary">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-muted hidden md:block">{firstName}</span>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button className="text-xs text-muted hover:text-accent transition-colors">Salir</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Hola, {firstName} 👋
          </h1>
          <p className="text-muted text-sm">Continúa aprendiendo desde donde lo dejaste</p>
        </div>

        {/* My courses */}
        {enrollments && enrollments.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-xl font-semibold text-white mb-5">Mis cursos</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {enrollments.map(({ courses: c }: any) => c && (
                <Link key={c.id} href={`/learn/${c.slug}`}
                  className="glass glass-hover rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all group">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 via-surface to-accent/5 flex items-center justify-center relative">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-xl">▶</span>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/60 text-xs text-white px-2 py-1 rounded-md backdrop-blur-sm">
                      Continuar
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-sm leading-tight">{c.title}</h3>
                    <div className="mt-2 bg-white/5 rounded-full h-1.5 w-full">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: "30%" }} />
                    </div>
                    <p className="text-xs text-muted mt-1.5">30% completado</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {(!enrollments || enrollments.length === 0) && (
          <div className="glass rounded-2xl p-10 border border-white/5 text-center mb-12">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="font-display font-semibold text-white mb-2">Aún no tienes cursos</h3>
            <p className="text-muted text-sm mb-6">Explora el catálogo y empieza a aprender hoy</p>
            <Link href="#catalogo" className="inline-flex items-center gap-2 bg-primary text-white font-medium px-6 py-2.5 rounded-full text-sm">
              Ver cursos disponibles →
            </Link>
          </div>
        )}

        {/* Catalog */}
        <section id="catalogo">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold text-white">Explorar catálogo</h2>
            <div className="flex gap-2">
              {["Todos","Principiante","Intermedio","Avanzado"].map(f => (
                <span key={f} className={`text-xs px-3 py-1.5 rounded-full cursor-pointer transition-all ${f==="Todos" ? "bg-primary text-white" : "glass text-muted hover:text-white"}`}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATALOG.map((course) => (
              <div key={course.id} className="glass glass-hover rounded-2xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all group">
                <div className="aspect-video bg-gradient-to-br from-primary/10 via-surface to-transparent flex items-center justify-center relative">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span>▶</span>
                  </div>
                  {course.tag && (
                    <span className="absolute top-2 left-2 bg-primary/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                      {course.tag}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted mb-1">{course.level} · {course.duration}</p>
                  <h3 className="font-semibold text-white text-sm mb-3">{course.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-white">${course.price.toLocaleString()}</span>
                    <Link href={`/cursos/${course.slug}`}
                      className="text-xs text-primary border border-primary/30 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all">
                      Ver curso
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
