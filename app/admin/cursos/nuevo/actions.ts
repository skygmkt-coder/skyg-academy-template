"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

export async function createCourse(
  formData: FormData
) {
  const supabase =
    await createClient();

  const title = formData.get(
    "title"
  ) as string;

  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9\s-]/g,
      ""
    )
    .trim()
    .replace(/\s+/g, "-");

  const price = Math.round(
    parseFloat(
      formData.get(
        "price"
      ) as string
    ) * 100
  );

  const { data, error } =
    await supabase
      .from("courses")
      .insert({
        title,
        slug,

        description:
          formData.get(
            "description"
          ),

        price_cents: price,

        published: false,
      })
      .select()
      .single();

  if (error) {
    redirect(
      `/admin/cursos/nuevo?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(
    `/admin/cursos/${data.id}`
  );
}
