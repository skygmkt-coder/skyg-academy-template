import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const SERVICES = [
  { icon: "🎬", title: "Producción de Video", desc: "Videos profesionales para tu marca. Desde concepto hasta entrega.", wa: "Hola, me interesa el servicio de Producción de Video" },
  { icon: "📸", title: "Fotografía Comercial", desc: "Sesiones fotográficas para productos, retratos y eventos.", wa: "Hola, me interesa Fotografía Comercial" },
  { icon: "🎨", title: "Identidad Visual", desc: "Logo, paleta, tipografía y manual de marca completo.", wa: "Hola, me interesa Identidad Visual" },
  { icon: "📱", title: "Contenido para Redes", desc: "Estrategia y producción de contenido mensual para redes.", wa: "Hola, me interesa Contenido para Redes" },
];
const FAQS = [
  { q: "¿Cuánto tiempo tengo acceso?", a: "Acceso de por vida incluyendo actualizaciones futuras." },
  { q: "¿Necesito experiencia previa?", a: "Cada curso indica el nivel requerido. Tenemos desde principiante hasta avanzado." },
  { q: "¿Puedo ver en mi celular?", a: "Sí, la plataforma está optimizada para todos los dispositivos." },
  { q: "¿Qué métodos de pago aceptan?", a: "Tarjetas Visa, Mastercard, Amex y otros métodos vía Stripe." },
  { q: "¿Tienen garantía?", a: "7 días de garantía. Si no estás satisfecho, te devolvemos tu dinero." },
];
const WA = "521XXXXXXXXXX";

async function getLiveCourses() {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data } = await db.from("courses").select("id,slug,title,description,price_cents,level,duration_minutes,thumbnail_url")
      .eq("published", true).eq("show_in_landing", true).order("created_at", { ascending: false }).limit(8);
    return data || [];
  } catch { return []; }
}

export default async function LandingPage() {
  const courses = await getLiveCourses();
  return (
    <>
      <main>
        {/* Hero */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-muted mb-8 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Plataforma de educación profesional
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
              Domina las <span className="text-primary">habilidades</span> del futuro
            </h1>
            <p className="text-muted text-lg mb-10 max-w-2xl mx-auto">
              Cursos profesionales en fotografía, video, diseño y marketing digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#cursos" className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-full transition-all">Ver cursos →</Link>
              <Link href="/registro" className="glass glass-hover text-white font-medium px-8 py-4 rounded-full transition-all">Crear cuenta gratis</Link>
            </div>
            <div className="flex gap-8 mt-16 justify-center">
              {[["1,200+","Estudiantes"],["15+","Cursos"],["4.9★","Valoración"]].map(([n,l])=>(
                <div key={l} className="text-center">
                  <div className="font-display text-2xl font-bold text-white">{n}</div>
                  <div className="text-xs text-muted mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Courses — DYNAMIC */}
        <section id="cursos" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-primary text-sm font-semibold mb-2 tracking-widest uppercase">Aprende con nosotros</p>
                <h2 className="font-display text-4xl font-bold text-white">Cursos disponibles</h2>
              </div>
              <Link href="/tienda" className="hidden md:block text-sm text-muted hover:text-white transition-colors">Ver todos →</Link>
            </div>
            {courses.length === 0 ? (
              <div className="text-center py-16 glass rounded-2xl border border-white/5">
                <p className="text-4xl mb-4">🎓</p>
                <p className="text-white font-semibold mb-2">Próximamente</p>
                <p className="text-sm text-muted">Estamos preparando contenido increíble.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {courses.map(c => (
                  <div key={c.id} className="glass glass-hover rounded-2xl overflow-hidden group border border-white/5 hover:border-primary/30 transition-all">
                    <div className="aspect-video relative overflow-hidden"
                      style={{ background: c.thumbnail_url ? `url(${c.thumbnail_url}) center/cover` : "linear-gradient(135deg,rgba(53,137,242,0.15),rgba(13,20,33,1))" }}>
                      {!c.thumbnail_url && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">▶</div>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-muted mb-2">{c.level || "Curso"}{c.duration_minutes ? ` · ${Math.round(c.duration_minutes/60)}h` : ""}</p>
                      <h3 className="font-display font-semibold text-white mb-2 leading-tight">{c.title}</h3>
                      {c.description && <p className="text-xs text-muted/80 mb-4 line-clamp-2">{c.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-white">${(c.price_cents/100).toLocaleString()}</span>
                      </div>
                      <Link href={`/cursos/${c.slug}`} className="mt-4 w-full flex items-center justify-center text-sm font-medium glass glass-hover py-2.5 rounded-xl border border-white/5 hover:border-primary/40 text-white transition-all">
                        Ver curso
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Services */}
        <section id="servicios" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-primary text-sm font-semibold mb-2 tracking-widest uppercase">Servicios profesionales</p>
              <h2 className="font-display text-4xl font-bold text-white mb-4">Nuestros servicios</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {SERVICES.map(s => (
                <div key={s.title} className="glass glass-hover rounded-2xl p-6 border border-white/5 flex flex-col">
                  <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-2xl mb-5 border border-white/5">{s.icon}</div>
                  <h3 className="font-display font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-muted leading-relaxed mb-6 flex-1">{s.desc}</p>
                  <a href={`https://wa.me/${WA}?text=${encodeURIComponent(s.wa)}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366]">
                    WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl font-bold text-white">Preguntas frecuentes</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((f,i) => (
                <details key={i} className="glass rounded-2xl border border-white/5 group overflow-hidden">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                    <span className="font-medium text-white">{f.q}</span>
                    <span className="text-muted group-open:rotate-45 transition-transform text-xl ml-4">+</span>
                  </summary>
                  <div className="px-6 pb-6 text-muted text-sm border-t border-white/5 pt-4">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-display font-bold text-lg"><span className="text-primary">SKYG</span><span className="text-white"> Academy</span></span>
          <div className="flex gap-6 text-sm text-muted">
            <Link href="#cursos" className="hover:text-white">Cursos</Link>
            <Link href="#servicios" className="hover:text-white">Servicios</Link>
            <Link href="#faq" className="hover:text-white">FAQ</Link>
            <Link href="/login" className="hover:text-white">Acceder</Link>
          </div>
          <p className="text-xs text-muted/50">© {new Date().getFullYear()} SKYG Academy</p>
        </div>
      </footer>
    </>
  );
}
