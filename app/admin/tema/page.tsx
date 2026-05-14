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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(c: any[]) {
          try {
            c.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

const FONT_OPTIONS = [
  "Sora",
  "Inter",
  "DM Sans",
  "Plus Jakarta Sans",
  "Nunito",
  "Poppins",
  "Raleway",
  "Montserrat",
  "Lato",
  "Open Sans",
];

export default async function TemaPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-white">
        No autorizado
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) {
    return (
      <div className="text-white">
        No autorizado
      </div>
    );
  }

  const { data: theme } = await supabase
    .from("theme")
    .select("*")
    .eq("id", 1)
    .single();

  const t = theme || {};

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Tema y marca
          </h1>

          <p className="text-sm text-white/40 mt-1">
            Personaliza la identidad visual de tu academia
          </p>
        </div>

        <form action={resetTheme}>
          <button
            type="submit"
            onClick={(e) => {
              if (
                !confirm("¿Restaurar todos los valores por defecto?")
              ) {
                e.preventDefault();
              }
            }}
            className="text-xs text-white/30 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all"
          >
            Restaurar defecto
          </button>
        </form>
      </div>

      {params.saved && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
          ✓ Cambios guardados
        </div>
      )}

      <form
        action={saveTheme}
        className="space-y-6"
        encType="multipart/form-data"
      >
        <div className="glass rounded-2xl p-6 border border-white/8">
          <h2 className="font-display text-sm font-bold text-white mb-5">
            Tema visual
          </h2>

          <input
            name="brand_name"
            defaultValue={t.brand_name || "SKYG Academy"}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
          />

          <button
            type="submit"
            className="w-full mt-6 bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl transition-all"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
