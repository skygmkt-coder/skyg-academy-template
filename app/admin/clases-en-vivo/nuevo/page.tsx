import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { createLiveClass } from "../actions";

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

export default async function NuevaClasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses").select("id, title").eq("published", true);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/clases-en-vivo" className="text-sm text-white/40 hover:text-white">
          ← Clases en vivo
        </Link>
        <span className="text-white/20">/</span>
        <h1 className="font-display text-xl font-bold text-white">Nueva clase en vivo</h1>
      </div>

      {params.error && (
        <div className="mb-5 bg-accent/10 border border-accent/20 text-accent text-sm px-4 py-3 rounded-xl">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <div className="glass rounded-2xl p-6 border border-white/8">
        <form action={createLiveClass} className="space-y-5">

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              Título de la clase *
            </label>
            <input name="title" required placeholder="Ej: Clase en vivo — Sesión de preguntas"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 text-sm transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              Descripción
            </label>
            <textarea name="description" rows={2} placeholder="¿De qué tratará esta sesión?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 text-sm transition-colors resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              Link de Zoom *
            </label>
            <input name="zoom_url" type="url" required placeholder="https://zoom.us/j/1234567890"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 text-sm transition-colors" />
            <p className="text-[11px] text-white/25 mt-1.5">
              Copia el link de invitación de tu reunión de Zoom
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Fecha y hora *
              </label>
              <input name="scheduled_at" type="datetime-local" required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 focus:outline-none focus:border-primary/50 text-sm transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Duración (minutos)
              </label>
              <input name="duration_minutes" type="number" defaultValue={60} min={15} step={15}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 text-sm transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              Vincular a curso (opcional)
            </label>
            <select name="course_id"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 text-sm transition-colors">
              <option value="">Sin vincular — clase general</option>
              {courses?.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 py-1">
            <input name="is_public" id="is_public" type="checkbox" className="accent-primary w-4 h-4" />
            <label htmlFor="is_public" className="text-sm text-white/60 cursor-pointer">
              Clase pública — visible para todos los visitantes
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit"
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all hover:shadow-glow">
              🎥 Crear clase en vivo
            </button>
            <Link href="/admin/clases-en-vivo"
              className="px-5 py-3 glass rounded-xl text-sm text-white/40 hover:text-white transition-all border border-white/5 text-center">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
