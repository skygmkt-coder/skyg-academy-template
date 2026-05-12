import Link from "next/link";

// ── MOCK DATA ──────────────────────────────────────────
const COURSES = [
  { id:"1", slug:"fotografia-profesional", title:"Fotografía Profesional", description:"Domina la cámara, la iluminación y el retoque desde cero.", price:1299, level:"Principiante", duration:"12 hrs", students:342, tag:"Más vendido" },
  { id:"2", slug:"edicion-video-premiere", title:"Edición de Video con Premiere", description:"Crea contenido audiovisual de alto impacto profesional.", price:999, level:"Intermedio", duration:"9 hrs", students:215, tag:"Nuevo" },
  { id:"3", slug:"identidad-de-marca", title:"Identidad de Marca Digital", description:"Diseña marcas memorables con estrategia y creatividad.", price:1499, level:"Avanzado", duration:"15 hrs", students:189, tag:"" },
  { id:"4", slug:"instagram-profesional", title:"Instagram Profesional", description:"Crece tu comunidad y monetiza tu contenido en Instagram.", price:799, level:"Principiante", duration:"6 hrs", students:520, tag:"Popular" },
];

const SERVICES = [
  { icon:"🎬", title:"Producción de Video", desc:"Videos profesionales para tu marca, empresa o canal. Desde concepto hasta entrega final.", wa:"Hola, me interesa el servicio de Producción de Video" },
  { icon:"📸", title:"Fotografía Comercial", desc:"Sesiones fotográficas profesionales para productos, retratos y eventos corporativos.", wa:"Hola, me interesa el servicio de Fotografía Comercial" },
  { icon:"🎨", title:"Identidad Visual", desc:"Diseño de logo, paleta, tipografía y manual de marca completo para tu negocio.", wa:"Hola, me interesa el servicio de Identidad Visual" },
  { icon:"📱", title:"Contenido para Redes", desc:"Estrategia, diseño y producción de contenido mensual para tus plataformas digitales.", wa:"Hola, me interesa el servicio de Contenido para Redes" },
];

const FAQS = [
  { q:"¿Cuánto tiempo tengo acceso a los cursos?", a:"Acceso de por vida. Una vez que compras un curso, es tuyo para siempre, incluyendo actualizaciones futuras." },
  { q:"¿Necesito experiencia previa?", a:"Cada curso indica el nivel requerido. Tenemos desde cursos para principiantes absolutos hasta avanzados." },
  { q:"¿Puedo ver los cursos en mi celular?", a:"Sí, la plataforma está optimizada para todos los dispositivos: computadora, tablet y celular." },
  { q:"¿Qué métodos de pago aceptan?", a:"Aceptamos tarjetas de crédito y débito (Visa, Mastercard, Amex) y otros métodos a través de Stripe." },
  { q:"¿Tienen garantía de satisfacción?", a:"Sí, ofrecemos garantía de 7 días. Si no estás satisfecho, te devolvemos tu dinero sin preguntas." },
  { q:"¿Los certificados tienen validez?", a:"Emitimos certificados digitales de finalización que puedes compartir en LinkedIn y tu portafolio." },
];

const WA_NUMBER = "521XXXXXXXXXX"; // ← cambiar por tu número

// ── COMPONENTS ─────────────────────────────────────────

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-xl tracking-tight">
          <span className="text-primary">SKYG</span>
          <span className="text-white"> Academy</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted font-medium">
          <Link href="#cursos" className="hover:text-white transition-colors">Cursos</Link>
          <Link href="#servicios" className="hover:text-white transition-colors">Servicios</Link>
          <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted hover:text-white transition-colors px-4 py-2">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="text-sm font-semibold bg-primary hover:bg-primary-dark transition-colors text-white px-5 py-2 rounded-full">
            Comenzar gratis
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-muted mb-8 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Plataforma de educación profesional
          </div>
          <h1 className="font-display text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
            Domina las<br />
            <span className="text-primary">habilidades</span><br />
            del futuro
          </h1>
          <p className="text-muted text-lg leading-relaxed mb-10 max-w-md">
            Cursos profesionales en fotografía, video, diseño y marketing digital. 
            Aprende a tu ritmo con acceso de por vida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="#cursos" className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-full transition-all hover:shadow-glow">
              Ver cursos →
            </Link>
            <Link href="/registro" className="flex items-center justify-center gap-2 glass glass-hover text-white font-medium px-8 py-4 rounded-full transition-all">
              Crear cuenta gratis
            </Link>
          </div>
          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-12 border-t border-white/5">
            {[["1,200+","Estudiantes"],["15+","Cursos"],["4.9★","Valoración"]].map(([n,l])=>(
              <div key={l}>
                <div className="font-display text-2xl font-bold text-white">{n}</div>
                <div className="text-xs text-muted mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — glass course cards stack */}
        <div className="relative hidden lg:flex items-center justify-center">
          <div className="relative w-full max-w-sm">
            {/* Background cards */}
            <div className="absolute -top-4 -right-4 w-full h-full glass rounded-2xl border border-white/5 rotate-3" />
            <div className="absolute -top-2 -right-2 w-full h-full glass rounded-2xl border border-white/5 rotate-1" />
            {/* Main card */}
            <div className="relative glass rounded-2xl p-6 border border-white/10 shadow-card">
              <div className="aspect-video w-full bg-gradient-to-br from-primary/20 to-accent/10 rounded-xl mb-5 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                  <span className="text-2xl">▶</span>
                </div>
              </div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-primary font-semibold mb-1">FOTOGRAFÍA · PRINCIPIANTE</p>
                  <h3 className="font-display font-bold text-white">Fotografía Profesional</h3>
                </div>
                <span className="glass text-xs text-primary px-3 py-1 rounded-full border border-primary/20">Más vendido</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted">
                <span>12 hrs · 342 estudiantes</span>
                <span className="text-xl font-display font-bold text-white">$1,299</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoursesSection() {
  return (
    <section id="cursos" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-primary text-sm font-semibold mb-2 tracking-widest uppercase">Aprende con nosotros</p>
            <h2 className="font-display text-4xl font-bold text-white">Cursos disponibles</h2>
          </div>
          <Link href="/registro" className="hidden md:block text-sm text-muted hover:text-white transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {COURSES.map((course, i) => (
            <div key={course.id}
              className="glass glass-hover rounded-2xl overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/30 transition-all duration-300"
              style={{ animationDelay: `${i*0.1}s` }}>
              <div className="aspect-video bg-gradient-to-br from-primary/15 via-surface to-accent/5 flex items-center justify-center relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-xl">▶</span>
                </div>
                {course.tag && (
                  <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {course.tag}
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs text-muted mb-2">{course.level} · {course.duration}</p>
                <h3 className="font-display font-semibold text-white mb-2 leading-tight">{course.title}</h3>
                <p className="text-xs text-muted/80 leading-relaxed mb-4">{course.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{course.students} estudiantes</span>
                  <span className="font-display font-bold text-white">${course.price.toLocaleString()}</span>
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

function PromoBanner() {
  return (
    <section className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10 border border-primary/20 p-10 lg:p-16">
          {/* Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 justify-between">
            <div>
              <span className="inline-block bg-accent text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                ✦ Nuevo lanzamiento
              </span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                Edición de Video<br />
                <span className="text-primary">con Premiere Pro</span>
              </h2>
              <p className="text-muted max-w-lg leading-relaxed">
                El curso más completo de edición profesional. Desde cortes básicos hasta motion graphics avanzados.
                9 horas de contenido, proyectos reales y certificado incluido.
              </p>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex -space-x-2">
                  {["🧑","👩","🧔","👧"].map((e,i)=>(
                    <div key={i} className="w-8 h-8 rounded-full glass border border-white/20 flex items-center justify-center text-sm">
                      {e}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted">+215 ya se inscribieron</span>
              </div>
            </div>
            <div className="text-center shrink-0">
              <div className="text-muted text-sm mb-1">Precio de lanzamiento</div>
              <div className="font-display text-5xl font-bold text-white mb-1">$999</div>
              <div className="text-muted/60 text-sm line-through mb-6">$1,499</div>
              <Link href="/cursos/edicion-video-premiere"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-full transition-all hover:shadow-glow whitespace-nowrap">
                Quiero este curso →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
          {SERVICES.map((s)=>(
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
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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

// ── PAGE ──────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <NavBar />
      <main>
        <Hero />
        <CoursesSection />
        <PromoBanner />
        <ServicesSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
