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

export async function signUp(
  formData: FormData
) {
  const supabase = await createClient();

  const { error } =
    await supabase.auth.signUp({
      email: formData.get("email") as string,

      password: formData.get(
        "password"
      ) as string,

      options: {
        data: {
          full_name:
            formData.get("full_name"),
        },
      },
    });

  if (error) {
    redirect(
      `/registro?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/dashboard");
}
