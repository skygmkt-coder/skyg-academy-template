import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
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

  const ClassCard = ({ c, isPast }: { c: any; isPast?: boolean }) => (
    <div className={`flex items-center justify-between px-5 py-4 border-b border-white/[0.04] last:border-0 ${isPast ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0 text-lg">
          🎥
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{c.title}</p>
          <p className="text-xs text-white/30 mt-0.5">
            {new Date(c.scheduled_at).toLocaleString("es-MX", {
              weekday: "short", day: "numeric", month: "short",
              hour: "2-digit", minute: "2-digit"
            })}
            {" · "}{c.duration_minutes} min
            {c.courses && <span className="text-primary"> · {c.courses.title}</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <span className={`text-xs px-2.5 py-1 rounded-full border ${
          c.is_public
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : "bg-white/5 text-white/30 border-white/10"
        }`}>
          {c.is_public ? "Público" : "Solo alumnos"}
        </span>
        <a href={c.zoom_url} target="_blank" rel="noopener noreferrer"
          className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/25 transition-all">
          Abrir Zoom
        </a>
        <form action={async () => { "use server"; await deleteLiveClass(c.id); }}>
          <button type="submit"
            onClick={(e) => { if (!confirm("¿Eliminar esta clase?")) e.preventDefault(); }}
            className="text-xs text-accent/50 hover:text-accent transition-colors px-2">
            ×
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Clases en vivo</h1>
          <p className="text-sm text-white/40 mt-1">Gestiona tus sesiones de Zoom</p>
        </div>
        <Link href="/admin/clases-en-vivo/nuevo"
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-glow">
          🎥 Nueva clase
        </Link>
      </div>

      {/* Upcoming */}
      <h2 className="font-display text-sm font-bold text-white/50 uppercase tracking-wider mb-3">
        Próximas ({upcoming?.length || 0})
      </h2>
      <div className="glass rounded-2xl border border-white/5 overflow-hidden mb-6">
        {upcoming && upcoming.length > 0
          ? upcoming.map(c => <ClassCard key={c.id} c={c} />)
          : (
            <div className="px-5 py-8 text-center text-sm text-white/30">
              No hay clases programadas.{" "}
              <Link href="/admin/clases-en-vivo/nuevo" className="text-primary hover:underline">
                Crear una
              </Link>
            </div>
          )}
      </div>

      {/* Past */}
      {past && past.length > 0 && (
        <>
          <h2 className="font-display text-sm font-bold text-white/30 uppercase tracking-wider mb-3">
            Historial
          </h2>
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            {past.map(c => <ClassCard key={c.id} c={c} isPast />)}
          </div>
        </>
      )}
    </div>
  );
}
