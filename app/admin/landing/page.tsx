import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import {
  saveBlock, toggleBlock, deleteBlock,
  moveBlock, addBlock,
} from "./actions";

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

const BLOCK_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  hero:         { label: "Hero principal",    icon: "🏠", description: "Título grande, subtítulo y CTAs" },
  courses_grid: { label: "Grilla de cursos",  icon: "📚", description: "Muestra cursos publicados automáticamente" },
  promo_banner: { label: "Banner promocional",icon: "🎯", description: "Anuncio de curso o novedad" },
  services:     { label: "Servicios",          icon: "⚙️", description: "Cards de servicios con botón WhatsApp" },
  faq:          { label: "Preguntas frecuentes", icon: "❓", description: "Acordeón de preguntas y respuestas" },
  text_image:   { label: "Texto + Imagen",    icon: "🖼", description: "Sección con texto e imagen al lado" },
  cta:          { label: "Llamada a acción",  icon: "✨", description: "Banner con botón de conversión" },
};

const BLOCK_TYPES = Object.keys(BLOCK_LABELS);

export default async function LandingCMSPage() {
  const supabase = await createClient();
  const { data: blocks } = await supabase
    .from("landing_blocks")
    .select("*")
    .order("order_index", { ascending: true });

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">CMS Landing</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            Edita el contenido de tu página principal
          </p>
        </div>
        <a href="/" target="_blank"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
          <Icons.explore size={14} />
          Ver landing
        </a>
      </div>

      {/* Add block */}
      <div className="mb-6 rounded-2xl p-5"
        style={{ background: "rgba(53,137,242,0.06)", border: "1px solid rgba(53,137,242,0.15)" }}>
        <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Agregar sección</p>
        <form action={addBlock} className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map(type => (
            <button key={type} name="type" value={type} type="submit"
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.5)",
              }}>
              {BLOCK_LABELS[type].icon} {BLOCK_LABELS[type].label}
            </button>
          ))}
        </form>
      </div>

      {/* Blocks list */}
      <div className="space-y-3">
        {blocks?.map((block, i) => (
          <div key={block.id}
            className="rounded-2xl overflow-hidden"
            style={{
              background: block.enabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
              border: `1px solid ${block.enabled ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)"}`,
              opacity: block.enabled ? 1 : 0.5,
            }}>

            {/* Block header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <span className="text-lg">{BLOCK_LABELS[block.type]?.icon || "📦"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  {BLOCK_LABELS[block.type]?.label || block.type}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {BLOCK_LABELS[block.type]?.description}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Move up */}
                {i > 0 && (
                  <form action={async () => { "use server"; await moveBlock(block.id, "up"); }}>
                    <button type="submit" className="text-xs px-2 py-1.5 rounded-lg transition-all"
                      style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)" }}>
                      ↑
                    </button>
                  </form>
                )}
                {/* Move down */}
                {blocks && i < blocks.length - 1 && (
                  <form action={async () => { "use server"; await moveBlock(block.id, "down"); }}>
                    <button type="submit" className="text-xs px-2 py-1.5 rounded-lg transition-all"
                      style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)" }}>
                      ↓
                    </button>
                  </form>
                )}
                {/* Toggle */}
                <form action={async () => { "use server"; await toggleBlock(block.id, block.enabled); }}>
                  <button type="submit"
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{
                      background: block.enabled ? "rgba(22,163,74,0.1)" : "rgba(255,255,255,0.05)",
                      color: block.enabled ? "#4ade80" : "rgba(255,255,255,0.3)",
                      border: block.enabled ? "1px solid rgba(22,163,74,0.2)" : "1px solid rgba(255,255,255,0.08)",
                    }}>
                    {block.enabled ? "Visible" : "Oculto"}
                  </button>
                </form>
                {/* Delete */}
                <form action={async () => { "use server"; await deleteBlock(block.id); }}>
                  <button type="submit"
                    onClick={(e) => { if (!confirm("¿Eliminar esta sección?")) e.preventDefault(); }}
                    className="text-xs px-2 py-1.5 rounded-lg transition-colors"
                    style={{ color: "rgba(232,0,74,0.4)" }}>
                    ×
                  </button>
                </form>
              </div>
            </div>

            {/* Block content editor */}
            <div className="px-5 py-4">
              <BlockEditor block={block} />
            </div>
          </div>
        ))}

        {(!blocks || blocks.length === 0) && (
          <div className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
            No hay secciones. Agrega una arriba.
          </div>
        )}
      </div>
    </div>
  );
}

// ── BLOCK EDITORS ─────────────────────────────────────
function BlockEditor({ block }: { block: any }) {
  const content = block.content || {};

  const input = (key: string, label: string, type = "text", placeholder = "") => (
    <div key={key}>
      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <input name={key} type={type} defaultValue={content[key] || ""} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm
          placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors" />
    </div>
  );

  const textarea = (key: string, label: string, rows = 2) => (
    <div key={key}>
      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <textarea name={key} defaultValue={content[key] || ""} rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm
          placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors resize-none" />
    </div>
  );

  const fields: Record<string, React.ReactNode[]> = {
    hero: [
      input("eyebrow", "Texto pequeño encima del título"),
      input("title", "Título principal"),
      textarea("subtitle", "Subtítulo"),
      <div key="ctas" className="grid grid-cols-2 gap-3">
        {input("cta_primary_label", "Texto botón 1")}
        {input("cta_primary_href", "Link botón 1", "text", "/#cursos")}
        {input("cta_secondary_label", "Texto botón 2")}
        {input("cta_secondary_href", "Link botón 2", "text", "/registro")}
      </div>,
      <div key="stats" className="grid grid-cols-3 gap-3">
        {input("stat_1_value", "Stat 1 valor")}
        {input("stat_1_label", "Stat 1 label")}
        {input("stat_2_value", "Stat 2 valor")}
        {input("stat_2_label", "Stat 2 label")}
        {input("stat_3_value", "Stat 3 valor")}
        {input("stat_3_label", "Stat 3 label")}
      </div>,
    ],
    promo_banner: [
      input("tag", "Badge (ej: Nuevo lanzamiento)"),
      input("title", "Título"),
      input("title_accent", "Parte del título en color primario"),
      textarea("description", "Descripción"),
      input("price", "Precio (ej: $999)"),
      input("old_price", "Precio anterior (ej: $1,499)"),
      input("cta_label", "Texto del botón"),
      input("cta_href", "Link del botón"),
    ],
    services: [
      textarea("services_json", "Servicios (JSON)", 4),
      <p key="hint" className="text-xs text-white/20 mt-1">
        Formato: {"[{\"icon\":\"🎬\",\"title\":\"Nombre\",\"desc\":\"Descripción\",\"wa\":\"Mensaje WhatsApp\"}]"}
      </p>,
    ],
    faq: [
      textarea("faqs_json", "Preguntas (JSON)", 5),
      <p key="hint" className="text-xs text-white/20 mt-1">
        Formato: {"[{\"q\":\"Pregunta\",\"a\":\"Respuesta\"}]"}
      </p>,
    ],
    text_image: [
      input("title", "Título"),
      textarea("body", "Texto", 3),
      input("image_url", "URL de imagen"),
      input("image_side", "Imagen a la (left / right)", "text", "right"),
      input("cta_label", "Texto del botón (opcional)"),
      input("cta_href", "Link del botón"),
    ],
    cta: [
      input("title", "Título"),
      textarea("subtitle", "Subtítulo"),
      input("cta_label", "Texto del botón"),
      input("cta_href", "Link del botón"),
      input("bg_style", "Estilo fondo (primary / accent / dark)", "text", "primary"),
    ],
    courses_grid: [
      <p key="info" className="text-xs text-white/40 italic">
        Esta sección muestra automáticamente los cursos publicados en Supabase. No necesita configuración.
      </p>,
    ],
  };

  const blockFields = fields[block.type] || [
    textarea("content_json", "Contenido (JSON)", 4),
  ];

  return (
    <form action={saveBlock} className="space-y-3">
      <input type="hidden" name="block_id" value={block.id} />
      <input type="hidden" name="block_type" value={block.type} />
      {blockFields}
      <button type="submit"
        className="text-xs font-semibold px-5 py-2 rounded-xl transition-all"
        style={{ background: "rgba(53,137,242,0.15)", border: "1px solid rgba(53,137,242,0.25)", color: "var(--color-primary, #3589F2)" }}>
        Guardar sección
      </button>
    </form>
  );
}
