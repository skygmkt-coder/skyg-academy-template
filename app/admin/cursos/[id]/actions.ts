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

export async function togglePublish(
  courseId: string,
  current: boolean
) {
  const supabase =
    await createClient();

  await supabase
    .from("courses")
    .update({
      published: !current,
    })
    .eq("id", courseId);

  revalidatePath(
    `/admin/cursos/${courseId}`
  );
}

export async function addModule(
  courseId: string,
  formData: FormData
) {
  const supabase =
    await createClient();

  const { data: last } =
    await supabase
      .from("modules")
      .select("order_index")
      .eq("course_id", courseId)
      .order("order_index", {
        ascending: false,
      })
      .limit(1)
      .single();

  await supabase
    .from("modules")
    .insert({
      course_id: courseId,
      title: formData.get("title"),
      order_index:
        (last?.order_index ?? -1) +
        1,
    });

  revalidatePath(
    `/admin/cursos/${courseId}`
  );
}

export async function addLesson(
  moduleId: string,
  courseId: string,
  formData: FormData
) {
  const supabase =
    await createClient();

  const { data: last } =
    await supabase
      .from("lessons")
      .select("order_index")
      .eq("module_id", moduleId)
      .order("order_index", {
        ascending: false,
      })
      .limit(1)
      .single();

  await supabase
    .from("lessons")
    .insert({
      module_id: moduleId,

      title: formData.get(
        "title"
      ),

      video_url:
        formData.get("video_url"),

      is_free_preview:
        formData.get(
          "is_free_preview"
        ) === "on",

      order_index:
        (last?.order_index ?? -1) +
        1,
    });

  revalidatePath(
    `/admin/cursos/${courseId}`
  );
}
