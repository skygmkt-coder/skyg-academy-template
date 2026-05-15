import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// ── Static data (services, FAQs, WhatsApp) ─────────────
const SERVICES = [
  { icon: "🎬", title: "Producción de Video", desc: "Videos profesionales para tu marca, empresa o canal. Desde concepto hasta entrega final.", wa: "Hola, me interesa el servicio de Producción de Video" },
  { icon: "📸", title: "Fotografía Comercial", desc: "Sesiones fotográficas profesionales para productos, retratos y eventos corporativos.", wa: "Hola, me interesa el servicio de Fotografía Comercial" },
  { icon: "🎨", title: "Identidad Visual", desc: "Diseño de logo, paleta, tipografía y manual de marca completo para tu negocio.", wa: "Hola, me interesa el servicio de Identidad Visual" },
  { icon: "📱", title: "Contenido para Redes", desc: "Estrategia, diseño y producción de contenido mensual para tus plataformas digitales.", wa: "Hola, me interesa el servicio de Contenido para Redes" },
];

const FAQS = [
  { q: "¿Cuánto tiempo tengo acceso a los cursos?", a: "Acceso de por vida. Una vez que compras un curso, es tuyo para siempre, incluyendo actualizaciones futuras." },
  { q: "¿Necesito experiencia previa?", a: "Cada curso indica el nivel requerido. Tenemos desde cursos para principiantes absolutos hasta avanzados." },
  { q: "¿Puedo ver los cursos en mi celular?", a: "Sí, la plataforma está optimizada para todos los dispositivos: computadora, tablet y celular." },
  { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, Amex) y otros métodos a través de Stripe." },
  { q: "¿Tienen garantía de satisfacción?", a: "Sí, ofrecemos garantía de 7 días. Si no estás satisfecho, te devolvemos tu dinero sin preguntas." },
  { q: "¿Los certificados tienen validez?", a: "Emitimos certificados digitales de finalización que puedes compartir en LinkedIn y tu portafolio." },
];

const WA_NUMBER = "521XXXXXXXXXX"; // ← cambiar por tu número real

// ── Fetch live courses from Supabase ───────────────────
async function getLiveCourses() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("courses")
      .select("id, slug, title, description, price_cents, level, duration_minutes, thumbnail_url, promo_video_url")
      .eq("published", true)
      .eq("show_in_landing", true)
      .order("created_at", { ascending: false })
      .limit(8);
    return data || [];
  } catch {
    return [];
  }
}

// ── Fetch landing blocks from CMS ──────────────────────
async function getLandingBlocks() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("landing_blocks")
      .select("*")
      .eq("enabled", true)
      .order("order_index", { ascending: true });
    return data || [];
  } catch {
    return [];
  }
}

// ── Hero ───────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/8 blur-[100px] pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-muted mb-8 border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Plataforma de educación profesional
        </div>
        <h1 className="font-display text-5xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
          Domina las<br />
          <span className="text-primary">habilidades</span><br />
          del futuro
        </h1>
        <p className="text-muted text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          Cursos profesionales en fotografía, video, diseño y marketing digital.
          Aprende a tu ritmo con acceso de por vida.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="#cursos" className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-full transition-all hover:shadow-glow">
            Ver cursos →
          </Link>
          <Link href="/registro" className="flex items-center justify-center gap-2 glass glass-hover text-white font-medium px-8 py-4 rounded-full transition-all">
            Crear cuenta gratis
          </Link>
        </div>
        <div className="flex gap-8 mt-16 justify-center">
          {[["1,200+", "Estudiantes"], ["15+", "Cursos"], ["4.9★", "Valoración"]].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="font-display text-2xl font-bold text-white">{n}</div>
              <div className="text-xs text-muted mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Dynamic Courses Section ────────────────────────────
function CoursesSection({ courses }: { courses: any[] }) {
  // If no courses in DB yet, show placeholder
  if (courses.length === 0) {
    return (
      <section id="cursos" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-primary text-sm font-semibold mb-2 tracking-widest uppercase">Aprende con nosotros</p>
              <h2 className="font-display text-4xl font-bold text-white">Cursos disponibles</h2>
            </div>
          </div>
          <div className="text-center py-16 glass rounded-2xl border border-white/5">
            <p className="text-4xl mb-4">🎓</p>
            <p className="text-white font-semibold mb-2">Próximamente</p>
            <p className="text-sm text-muted">Estamos preparando contenido increíble para ti.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="cursos" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-primary text-sm font-semibold mb-2 tracking-widest uppercase">Aprende con nosotros</p>
            <h2 className="font-display text-4xl font-bold text-white">Cursos disponibles</h2>
          </div>
          <Link href="/tienda" className="hidden md:block text-sm text-muted hover:text-white transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {courses.map((course, i) => (
            <div key={course.id}
              className="glass glass-hover rounded-2xl overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/30 transition-all duration-300"
              style={{ animationDelay: `${i * 0.1}s` }}>
              {/* Thumbnail */}
              <div className="aspect-video relative overflow-hidden"
                style={{
                  background: course.thumbnail_url
                    ? `url(${course.thumbnail_url}) center/cover`
                    : "linear-gradient(135deg, rgba(53,137,242,0.15), rgba(13,20,33,1))",
                }}>
                {!course.thumbnail_url && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-xl">▶</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-5">
                <p className="text-xs text-muted mb-2">
                  {course.level || "Curso"}{course.duration_minutes ? ` · ${Math.round(course.duration_minutes / 60)}h` : ""}
                </p>
                <h3 className="font-display font-semibold text-white mb-2 leading-tight">{course.title}</h3>
                {course.description && (
                  <p className="text-xs text-muted/80 leading-relaxed mb-4 line-clamp-2">{course.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-white">
                    ${(course.price_cents / 100).toLocaleString()}
                  </span>
                </div>
                <Link href={`/cursos/${course.slug}`}
                  className="mt-4 w-full flex items-center justify-center text-sm font-medium glass glass-hover py-2.5 rounded-xl border border-white/5 hover:border-primary/40 text-white transition-all">
                  Ver curso
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Services ───────────────────────────────────────────
function ServicesSection() {
  return (
    <section id="servicios" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-primary text-sm font-semibold mb-2 tracking-widest uppercase">¿Necesitas algo personalizado?</p>
          <h2 className="font-display text-4xl font-bold text-white mb-4">Nuestros servicios</h2>
          <p className="text-muted max-w-lg mx-auto">Además de los cursos, ofrecemos servicios profesionales para empresas y creadores de contenido.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICES.map((s) => (
            <div key={s.title} className="glass glass-hover rounded-2xl p-6 border border-white/5 hover:border-primary/20 transition-all duration-300 flex flex-col">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-2xl mb-5 border border-white/5">
                {s.icon}
              </div>
              <h3 className="font-display font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed mb-6 flex-1">{s.desc}</p>
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(s.wa)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Contactar por WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────
function FAQSection() {
  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-primary text-sm font-semibold mb-2 tracking-widest uppercase">Resolvemos tus dudas</p>
          <h2 className="font-display text-4xl font-bold text-white">Preguntas frecuentes</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <details key={i} className="glass rounded-2xl border border-white/5 group overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-white/[0.02] transition-colors">
                <span className="font-medium text-white">{faq.q}</span>
                <span className="text-muted group-open:rotate-45 transition-transform duration-300 text-xl ml-4 shrink-0">+</span>
              </summary>
              <div className="px-6 pb-6 text-muted text-sm leading-relaxed border-t border-white/5 pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="font-display font-bold text-lg">
            <span className="text-primary">SKYG</span>
            <span className="text-white"> Academy</span>
          </span>
          <p className="text-xs text-muted mt-1">Educación profesional en línea</p>
        </div>
        <div className="flex gap-6 text-sm text-muted">
          <Link href="#cursos" className="hover:text-white transition-colors">Cursos</Link>
          <Link href="#servicios" className="hover:text-white transition-colors">Servicios</Link>
          <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          <Link href="/login" className="hover:text-white transition-colors">Acceder</Link>
        </div>
        <p className="text-xs text-muted/50">© {new Date().getFullYear()} SKYG Template Academy</p>
      </div>
    </footer>
  );
}

// ── PAGE (Server Component — fetches live data) ────────
export default async function LandingPage() {
  // Parallel fetch: courses + landing blocks
  const [liveCourses] = await Promise.all([
    getLiveCourses(),
    getLandingBlocks(),
  ]);

  return (
    <>
      <main>
        <Hero />
        <CoursesSection courses={liveCourses} />
        <ServicesSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
