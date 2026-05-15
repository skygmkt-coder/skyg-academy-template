import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LearnRootPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = Boolean(profile?.is_admin || profile?.is_super_admin);

  const baseQuery = supabase
    .from("courses")
    .select("id, modules(id, order_index, lessons(id, position))")
    .eq("slug", slug);

  const finalQuery = isAdmin ? baseQuery : baseQuery.eq("published", true);
  const { data: course } = await finalQuery.maybeSingle();

  if (!course) notFound();

  if (!isAdmin) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle();

    if (!enrollment) redirect(`/cursos/${slug}?access=denied`);
  }

  const firstLesson = [...(course.modules || [])]
    .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .flatMap((m: any) => [...(m.lessons || [])].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)))[0];

  if (firstLesson) redirect(`/learn/${slug}/${firstLesson.id}`);
  redirect(`/cursos/${slug}`);
}
