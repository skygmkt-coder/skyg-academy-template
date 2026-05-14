"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function createCourse(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const title = String(formData.get("title") || "");
  const price = Math.round(
    parseFloat(String(formData.get("price") || "0")) * 100
  );

  const courseType = String(formData.get("course_type") || "sellable");

  const isSellable = courseType === "sellable";
  const showOnLanding = formData.get("show_on_landing") === "on";
  const showInStore = formData.get("show_in_store") === "on";

  const { error } = await supabase.from("courses").insert({
    title,
    slug: slugify(title),
    description: formData.get("description") || null,
    price_cents: isSellable ? price : 0,
    published: false,
    promo_video_url: formData.get("promo_video_url") || null,
    thumbnail_url: formData.get("thumbnail_url") || null,
    level: formData.get("level") || null,
    duration_minutes: Number(formData.get("duration_hours") || 0) * 60,
    course_type: courseType,
    is_sellable: isSellable,
    show_on_landing: showOnLanding,
    show_in_store: isSellable ? showInStore : false,
    access_mode: isSellable ? "paid" : "manual",
    created_by: user.id,
  });

  if (error) {
    redirect(`/admin/cursos/nuevo?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/cursos");
}
