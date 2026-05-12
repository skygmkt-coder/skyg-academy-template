import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll(){ return cookieStore.getAll() }, setAll(c){ try{ c.forEach(({name,value,options})=>cookieStore.set(name,value,options))}catch{} } } }
  );
}

export default async function LearnRootPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses").select("id, modules(lessons(id, order_index, module_id), order_index)")
    .eq("slug", params.slug).single();
  if (!course) notFound();

  const firstLesson = course.modules
    ?.sort((a: any, b: any) => a.order_index - b.order_index)[0]
    ?.lessons?.sort((a: any, b: any) => a.order_index - b.order_index)[0];

  if (firstLesson) redirect(`/learn/${params.slug}/${firstLesson.id}`);
  redirect("/dashboard");
}
