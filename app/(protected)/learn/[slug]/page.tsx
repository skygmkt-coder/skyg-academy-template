import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LearnRootPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("id, modules(id, order_index, lessons(id, position))")
    .eq("slug", slug).single();

  if (!course) notFound();

  const firstLesson = [...(course.modules || [])]
    .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .flatMap((m: any) => [...(m.lessons || [])].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)))[0];

  if (firstLesson) redirect(`/learn/${slug}/${firstLesson.id}`);
  redirect("/dashboard");
}
