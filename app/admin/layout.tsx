import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

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

        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) =>
                cookieStore.set(
                  name,
                  value,
                  options
                )
            );
          } catch {}
        },
      },
    }
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "var(--bg-base)",
      }}
    >
      <aside className="w-56 glass border-r border-white/5 flex flex-col p-4 shrink-0">
        <Link
          href="/"
          className="font-display font-bold text-lg mb-8 block"
        >
          <span className="text-primary">
            SKYG
          </span>

          <span className="text-white">
            {" "}
            Admin
          </span>
        </Link>

        <nav className="space-y-1 text-sm">
          {[
            [
              "Dashboard",
              "/admin",
            ],
            [
              "Cursos",
              "/admin/cursos",
            ],
            [
              "Usuarios",
              "/admin/usuarios",
            ],
            [
              "← Academia",
              "/dashboard",
            ],
          ].map(
            ([label, href]) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
              >
                {label}
              </Link>
            )
          )}
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
