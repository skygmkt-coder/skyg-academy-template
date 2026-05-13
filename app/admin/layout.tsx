import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebarClient from "@/components/layout/AdminSidebarClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_admin, is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_super_admin) redirect("/dashboard");

  const adminUser = {
    name: profile?.full_name || user.email || "Admin",
    is_super_admin: profile?.is_super_admin === true,
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base, #070B12)" }}>
      <AdminSidebarClient user={adminUser} />

      {/*
        Desktop: padding-left sincronizado con --admin-sidebar-w (64px colapsado, 220px expandido)
        Mobile: padding-bottom para el bottom nav
      */}
      <main
        className="min-h-screen transition-all"
        style={{
          paddingLeft: "var(--admin-sidebar-w, 64px)",
          paddingBottom: "90px",
          transitionProperty: "padding-left",
          transitionDuration: "0.25s",
          transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Mobile: no padding-left */}
        <style>{`
          @media (max-width: 767px) {
            main { padding-left: 0 !important; padding-bottom: 90px !important; }
          }
        `}</style>
        <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
