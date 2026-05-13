"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

export async function createLiveClass(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("live_classes").insert({
    title: formData.get("title"),
    description: formData.get("description"),
    zoom_url: formData.get("zoom_url"),
    scheduled_at: new Date(formData.get("scheduled_at") as string).toISOString(),
    duration_minutes: parseInt(formData.get("duration_minutes") as string) || 60,
    course_id: formData.get("course_id") || null,
    is_public: formData.get("is_public") === "on",
    created_by: user.id,
  });

  if (error) redirect(`/admin/clases-en-vivo/nuevo?error=${encodeURIComponent(error.message)}`);
  redirect("/admin/clases-en-vivo");
}

export async function deleteLiveClass(classId: string) {
  const supabase = await createClient();
  await supabase.from("live_classes").delete().eq("id", classId);
  revalidatePath("/admin/clases-en-vivo");
  revalidatePath("/admin");
}
