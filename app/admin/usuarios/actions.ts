"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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

// Service client bypasses RLS
function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function grantAccess(userId: string, courseId: string) {
  const admin = adminClient();
  // Deactivate if exists, then insert active
  await admin.from("enrollments").delete()
    .eq("user_id", userId).eq("course_id", courseId);
  await admin.from("enrollments").insert({
    user_id: userId, course_id: courseId, active: true,
  });
  revalidatePath(`/admin/usuarios/${userId}`);
}

export async function revokeAccess(enrollmentId: string, userId: string) {
  const admin = adminClient();
  await admin.from("enrollments").update({ active: false }).eq("id", enrollmentId);
  revalidatePath(`/admin/usuarios/${userId}`);
}

export async function deleteEnrollment(enrollmentId: string, userId: string) {
  const admin = adminClient();
  await admin.from("enrollments").delete().eq("id", enrollmentId);
  revalidatePath(`/admin/usuarios/${userId}`);
}

export async function setRole(
  targetUserId: string,
  role: "alumno" | "admin" | "super_admin"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  // Verificar que el que ejecuta es super admin
  const { data: me } = await supabase.from("profiles")
    .select("is_super_admin").eq("id", user.id).single();
  if (!me?.is_super_admin) throw new Error("Solo el super admin puede cambiar roles");

  const admin = adminClient();
  await admin.from("profiles").update({
    is_admin: role === "admin" || role === "super_admin",
    is_super_admin: role === "super_admin",
  }).eq("id", targetUserId);

  revalidatePath(`/admin/usuarios/${targetUserId}`);
  revalidatePath("/admin/usuarios");
}
