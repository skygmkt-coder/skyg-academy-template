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

export async function updateCourse(courseId: string, formData: FormData) {
  const supabase = await createClient();
  const scheduledAt = formData.get("scheduled_at") as string;
  await supabase.from("courses").update({
    title: formData.get("title"),
    description: formData.get("description"),
    price_cents: Math.round(parseFloat((formData.get("price") as string) || "0") * 100),
    scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
  }).eq("id", courseId);
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function togglePublish(courseId: string, current: boolean) {
  const supabase = await createClient();
  await supabase.from("courses")
    .update({ published: !current, scheduled_at: !current ? null : undefined })
    .eq("id", courseId);
  revalidatePath(`/admin/cursos/${courseId}`);
  revalidatePath("/admin");
}

export async function deleteCourse(courseId: string) {
  const supabase = await createClient();
  await supabase.from("courses").delete().eq("id", courseId);
  redirect("/admin");
}

export async function addModule(courseId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: last } = await supabase.from("modules")
    .select("order_index").eq("course_id", courseId)
    .order("order_index", { ascending: false }).limit(1).single();
  await supabase.from("modules").insert({
    course_id: courseId,
    title: formData.get("title"),
    order_index: (last?.order_index ?? -1) + 1,
  });
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function deleteModule(moduleId: string, courseId: string) {
  const supabase = await createClient();
  await supabase.from("modules").delete().eq("id", moduleId);
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function addLesson(moduleId: string, courseId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: last } = await supabase.from("lessons")
    .select("order_index").eq("module_id", moduleId)
    .order("order_index", { ascending: false }).limit(1).single();
  await supabase.from("lessons").insert({
    module_id: moduleId,
    title: formData.get("title"),
    video_url: formData.get("video_url"),
    is_free_preview: formData.get("is_free_preview") === "on",
    order_index: (last?.order_index ?? -1) + 1,
  });
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function deleteLesson(lessonId: string, courseId: string) {
  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", lessonId);
  revalidatePath(`/admin/cursos/${courseId}`);
}
