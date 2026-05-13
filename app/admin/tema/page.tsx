import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { saveTheme, resetTheme } from "./actions";

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(c: any[]) {
          try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
}

const FONT_OPTIONS = [
  "Sora", "Inter", "DM Sans", "Plus Jakarta Sans",
  "Nunito", "Poppins", "Raleway", "Montserrat",
  "Lato", "Open Sans",
];

export default async function TemaPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: theme } = await supabase
    .from("theme").select("*").eq("id", 1).single();

  const t = theme || {};

  const ColorField = ({
    name, label, defaultValue, hint,
  }: {
    name: string; label: string; defaultValue: string; hint?: string;
  }) => (
    <div>
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input name={name} type="color" defaultValue={defaultValue}
          className="w-10 h-10 rounded-lg border border-white/15 bg-transparent cursor-pointer p-0.5" />
        <input name={`${name}_text`} type="text" defaultValue={defaultValue}
          placeholder={defaultValue}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 font-mono" />
      </div>
      {hint && <p className="text-[11px] text-white/25 mt-1.5">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Tema y marca</h1>
          <p className="text-sm text-white/40 mt-1">Personaliza la identidad visual de tu academia</p>
        </div>
        <form action={resetTheme}>
          <button type="submit"
            onClick={(e) => { if (!confirm("¿Restaurar todos los valores por defecto?")) e.preventDefault(); }}
            className="text-xs text-white/30 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all">
            Restaurar defecto
          </button>
        </form>
      </div>

      {params.saved && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
          ✓ Cambios guardados — el sitio se actualizará en unos segundos
        </div>
      )}

      <form action={saveTheme} className="space-y-6" encType="multipart/form-data">

        {/* Brand */}
        <div className="glass rounded-2xl p-6 border border-white/8">
          <h2 className="font-display text-sm font-bold text-white mb-5 flex items-center gap-2">
            <span>🏷</span> Identidad de marca
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Nombre de la academia
              </label>
              <input name="brand_name" defaultValue={t.brand_name || "SKYG Academy"}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Logo
              </label>
              {t.logo_url && (
                <div className="mb-3 p-3 glass rounded-xl border border-white/8 inline-flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.logo_url} alt="Logo actual" className="h-8 object-contain" />
                  <span className="text-xs text-white/40">Logo actual</span>
                </div>
              )}
              <input name="logo_file" type="file" accept="image/png,image/jpg,image/jpeg,image/svg+xml,image/webp"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/60 text-sm focus:outline-none focus:border-primary/50 transition-colors
                  file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold
                  file:bg-primary/20 file:text-primary cursor-pointer" />
              <p className="text-[11px] text-white/25 mt-1.5">PNG, SVG o WebP recomendado · Máx 2MB · Se sube a Supabase Storage</p>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="glass rounded-2xl p-6 border border-white/8">
          <h2 className="font-display text-sm font-bold text-white mb-5 flex items-center gap-2">
            <span>🎨</span> Colores
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <ColorField name="primary_color" label="Color primario"
              defaultValue={t.primary_color || "#3589F2"}
              hint="Botones, links, acentos" />
            <ColorField name="accent_color" label="Color acento"
              defaultValue={t.accent_color || "#E8004A"}
              hint="Badges, alertas, tags" />
            <ColorField name="bg_color" label="Fondo principal"
              defaultValue={t.bg_color || "#070B12"}
              hint="Color de fondo base" />
            <ColorField name="surface_color" label="Fondo superficies"
              defaultValue={t.surface_color || "#0D1421"}
              hint="Cards y paneles" />
            <ColorField name="text_color" label="Color de texto"
              defaultValue={t.text_color || "#E8EFF8"}
              hint="Texto principal" />
            <ColorField name="muted_color" label="Texto secundario"
              defaultValue={t.muted_color || "#8FA4C4"}
              hint="Subtítulos y metadatos" />
          </div>
        </div>

        {/* Glow effects */}
        <div className="glass rounded-2xl p-6 border border-white/8">
          <h2 className="font-display text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span>✨</span> Efecto de luz (glow)
          </h2>
          <p className="text-xs text-white/30 mb-5">
            El degradado difuminado que se ve en el fondo. Usa formato rgba(r,g,b,opacidad).
            Pon rgba(0,0,0,0) para desactivarlo o rgba(255,255,255,0.05) para fondo blanco.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Glow superior (color primario)
              </label>
              <input name="glow_color" defaultValue={t.glow_color || "rgba(53,137,242,0.13)"}
                placeholder="rgba(53,137,242,0.13)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Glow inferior (color acento)
              </label>
              <input name="glow_accent_color" defaultValue={t.glow_accent_color || "rgba(232,0,74,0.07)"}
                placeholder="rgba(232,0,74,0.07)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors" />
              <p className="text-[11px] text-white/25 mt-1.5">
                Para fondo blanco limpio: bg_color = #FFFFFF, glow_color = rgba(0,0,0,0)
              </p>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="glass rounded-2xl p-6 border border-white/8">
          <h2 className="font-display text-sm font-bold text-white mb-5 flex items-center gap-2">
            <span>🔤</span> Tipografía
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Fuente de títulos
              </label>
              <select name="font_display" defaultValue={t.font_display || "Sora"}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50">
                {FONT_OPTIONS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Fuente de texto
              </label>
              <select name="font_body" defaultValue={t.font_body || "DM Sans"}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50">
                {FONT_OPTIONS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button type="submit"
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-glow text-sm">
          Guardar cambios en toda la academia
        </button>
      </form>
    </div>
  );
}
