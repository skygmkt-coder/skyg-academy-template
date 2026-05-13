import { createClient } from "@/lib/supabase/server";
import NavController from "./NavController";

export type NavUser = {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_super_admin: boolean;
} | null;

export default async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let navUser: NavUser = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, is_admin, is_super_admin")
      .eq("id", user.id)
      .single();

    navUser = {
      id: user.id,
      email: user.email || "",
      full_name: profile?.full_name || user.email || "",
      is_admin: profile?.is_admin || false,
      is_super_admin: profile?.is_super_admin || false,
    };
  }

  return <NavController user={navUser} />;
}
