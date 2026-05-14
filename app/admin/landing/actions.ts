"use server";

import { createClient as adminClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function admin() {
  return adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll(c: any[]) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("is_admin, is_super_admin").eq("id", user.id).single();
  if (!profile?.is_admin && !profile?.is_super_admin) redirect("/admin");
}

function revalidate() {
  revalidatePath("/");
  revalidatePath("/admin/landing");
}

export async function saveBlock(formData: FormData) {
  await requireAdmin();
  const db = admin();
  const blockId = formData.get("block_id") as string;
  const blockType = formData.get("block_type") as string;

  // Build content object from all other form fields
  const skip = new Set(["block_id", "block_type"]);
  const content: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    if (skip.has(key)) continue;

    // Try to parse JSON fields
    if (key.endsWith("_json")) {
      try {
        content[key.replace("_json", "")] = JSON.parse(value as string);
      } catch {
        content[key] = value;
      }
    } else {
      content[key] = value;
    }
  }

  await db.from("landing_blocks").update({
    content,
    updated_at: new Date().toISOString(),
  }).eq("id", blockId);

  revalidate();
}

export async function toggleBlock(blockId: string, current: boolean) {
  await requireAdmin();
  await admin().from("landing_blocks").update({ enabled: !current }).eq("id", blockId);
  revalidate();
}

export async function deleteBlock(blockId: string) {
  await requireAdmin();
  await admin().from("landing_blocks").delete().eq("id", blockId);
  revalidate();
}

export async function moveBlock(blockId: string, direction: "up" | "down") {
  await requireAdmin();
  const db = admin();
  const { data: blocks } = await db.from("landing_blocks").select("id, order_index").order("order_index");
  if (!blocks) return;

  const idx = blocks.findIndex(b => b.id === blockId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= blocks.length) return;

  const [a, b] = [blocks[idx], blocks[swapIdx]];
  await db.from("landing_blocks").update({ order_index: b.order_index }).eq("id", a.id);
  await db.from("landing_blocks").update({ order_index: a.order_index }).eq("id", b.id);

  revalidate();
}

export async function addBlock(formData: FormData) {
  await requireAdmin();
  const db = admin();
  const type = formData.get("type") as string;

  const { data: last } = await db.from("landing_blocks")
    .select("order_index").order("order_index", { ascending: false }).limit(1).single();

  const defaultContent: Record<string, any> = {
    hero:         { eyebrow: "Texto aquí", title: "Título principal", subtitle: "Subtítulo", cta_primary_label: "Ver cursos", cta_primary_href: "/#cursos" },
    courses_grid: {},
    promo_banner: { tag: "Nuevo", title: "Título del banner", cta_label: "Ver más", cta_href: "#" },
    services:     { services: [{ icon: "⚙️", title: "Servicio", desc: "Descripción", wa: "Hola, me interesa el servicio" }] },
    faq:          { faqs: [{ q: "¿Pregunta?", a: "Respuesta aquí." }] },
    text_image:   { title: "Título", body: "Texto aquí.", image_url: "", image_side: "right" },
    cta:          { title: "¿Listo para empezar?", subtitle: "Únete hoy.", cta_label: "Comenzar", cta_href: "/registro", bg_style: "primary" },
  };

  await db.from("landing_blocks").insert({
    type,
    order_index: (last?.order_index ?? -1) + 1,
    enabled: true,
    content: defaultContent[type] || {},
  });

  revalidate();
}
