"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function saveTheme(formData: FormData) {
  const admin = adminClient();

  // Handle logo upload if a file was provided
  let logoUrl: string | undefined;
  const logoFile = formData.get("logo_file") as File;

  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop();
    const filename = `logo-${Date.now()}.${ext}`;
    const buffer = await logoFile.arrayBuffer();

    const { data: uploadData, error: uploadError } = await admin.storage
      .from("brand-assets")
      .upload(filename, buffer, {
        contentType: logoFile.type,
        upsert: true,
      });

    if (!uploadError && uploadData) {
      const { data: { publicUrl } } = admin.storage
        .from("brand-assets")
        .getPublicUrl(uploadData.path);
      logoUrl = publicUrl;
    }
  }

  const updateData: Record<string, any> = {
    brand_name: formData.get("brand_name"),
    primary_color: formData.get("primary_color"),
    accent_color: formData.get("accent_color"),
    bg_color: formData.get("bg_color"),
    surface_color: formData.get("surface_color"),
    glow_color: formData.get("glow_color"),
    glow_accent_color: formData.get("glow_accent_color"),
    text_color: formData.get("text_color"),
    muted_color: formData.get("muted_color"),
    font_display: formData.get("font_display"),
    font_body: formData.get("font_body"),
    updated_at: new Date().toISOString(),
  };

  if (logoUrl) updateData.logo_url = logoUrl;

  await admin.from("theme").upsert({ id: 1, ...updateData });

  revalidatePath("/");
  revalidatePath("/admin/tema");
  revalidatePath("/dashboard");
}

export async function resetTheme() {
  const admin = adminClient();
  await admin.from("theme").upsert({
    id: 1,
    brand_name: "SKYG Academy",
    logo_url: null,
    primary_color: "#3589F2",
    accent_color: "#E8004A",
    bg_color: "#070B12",
    surface_color: "#0D1421",
    glow_color: "rgba(53,137,242,0.13)",
    glow_accent_color: "rgba(232,0,74,0.07)",
    text_color: "#E8EFF8",
    muted_color: "#8FA4C4",
    font_display: "Sora",
    font_body: "DM Sans",
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/");
  revalidatePath("/admin/tema");
}
