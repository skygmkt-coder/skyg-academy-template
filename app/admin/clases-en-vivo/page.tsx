import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { deleteLiveClass } from "./actions";

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

function formatDate(d: string) {
  return new Date(d).toLocaleString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function minutesToHours(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}min` : `${h}h`;
}

export default async function ClasesEnVivoPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: upcoming } = await supabase
    .from("live_classes")
    .select("*, courses(title)")
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true });

  const { data: past } = await supabase
    .from("live_classes")
    .select("*, courses(title)")
    .lt("scheduled_at", now)
    .order("scheduled_at", { ascending: false })
    .limit(10);

  const Card = ({ c, isPast }: { c: any; isPast?: boolean }) => (
    <div
      className={`flex items-center gap-4 px-5 py-4 border-b last:border-0 transition-all ${isPast ? "opacity-40" : ""}`}
      style={{ borderColor: "rgba(255,255,255,0.04)" }}
    >
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-blue-400"
        style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <Icons.video size={20} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{c.title}</p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {formatDate(c.scheduled_at)}
          </span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            · {minutesToHours(c.duration_minutes || 60)}
          </span>
          {c.courses && (
            <span className="text-xs" style={{ color: "var(--color-primary, #3589F2)" }}>
              · {c.courses.title}
            </span>
          )}
        </div>
      </div>

      {/* Badges + Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: c.is_public ? "rgba(22,163,74,0.1)" : "rgba(255,255,255,0.05)",
            color: c.is_public ? "#4ade80" : "rgba(255,255,255,0.3)",
            border: c.is_public ? "1px solid rgba(22,163,74,0.2)" : "1px solid rgba(255,255,255,0.08)",
          }}>
          {c.is_public ? "Público" : "Solo alumnos"}
        </span>

        {!isPast && c.zoom_url && (
          <a
            href={c.zoom_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "rgba(37,99,235,0.15)",
              border: "1px solid rgba(37,99,235,0.3)",
              color: "#60a5fa",
            }}
          >
            <Icons.video size={14} />
            Abrir Zoom
          </a>
        )}

        {c.recording_url && (
          <a href={c.recording_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
            }}>
            <Icons.play size={12} />
            Grabación
          </a>
        )}

        <form action={async () => { "use server"; await deleteLiveClass(c.id); }}>
          <button type="submit"
            onClick={(e) => { if (!confirm("¿Eliminar clase?")) e.preventDefault(); }}
            className="text-sm px-2 py-1 rounded-lg transition-colors"
            style={{ color: "rgba(232,0,74,0.4)" }}>
            ×
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Clases en vivo</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            Gestiona tus sesiones en Zoom
          </p>
        </div>
        <Link href="/admin/clases-en-vivo/nuevo"
          className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
          style={{ background: "var(--color-primary, #3589F2)", color: "#fff" }}>
          <Icons.plus size={16} />
          Nueva clase
        </Link>
      </div>

      {/* Zoom info box */}
      <div className="mb-6 p-4 rounded-xl flex gap-3"
        style={{ background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.15)" }}>
        <Icons.video size={18} />
        <div>
          <p className="text-sm font-semibold text-white mb-1">¿Cómo funciona con Zoom?</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
            Crea la reunión en Zoom → copia el link de invitación → pégalo aquí.
            Tus alumnos verán el botón "Unirse a la clase" que abrirá Zoom directamente.
            El embed directo de Zoom requiere Zoom SDK (cuenta Pro). Si prefieres una alternativa
            gratuita con embed, puedes usar <strong className="text-white/60">Google Meet</strong> o <strong className="text-white/60">Jitsi</strong>.
          </p>
        </div>
      </div>

      {/* Upcoming */}
      <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: "rgba(255,255,255,0.3)" }}>
        Próximas ({upcoming?.length || 0})
      </h2>
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {upcoming && upcoming.length > 0
          ? upcoming.map(c => <Card key={c.id} c={c} />)
          : (
            <div className="px-5 py-10 text-center text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
              No hay clases programadas.{" "}
              <Link href="/admin/clases-en-vivo/nuevo" style={{ color: "var(--color-primary, #3589F2)" }}>
                Crear una →
              </Link>
            </div>
          )}
      </div>

      {/* Past */}
      {past && past.length > 0 && (
        <>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "rgba(255,255,255,0.2)" }}>
            Historial
          </h2>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            {past.map(c => <Card key={c.id} c={c} isPast />)}
          </div>
        </>
      )}
    </div>
  );
}
