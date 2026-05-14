import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CourseEditorClient from "@/components/course/CourseEditorClient";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select(`
      id, title, slug, description, price_cents, level, duration_minutes,
      published, scheduled_at, thumbnail_url, promo_video_url,
      course_type, show_in_landing, show_in_store,
      modules (
        id, title, order_index,
        lessons (
          id, title, video_url, order_index, is_free_preview
        )
      )
    `)
    .eq("id", id)
    .single();

  if (!course) notFound();

  // Sort modules and lessons
  const sorted = {
    ...course,
    modules: [...(course.modules || [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map(m => ({
        ...m,
        lessons: [...(m.lessons || [])].sort((a, b) => a.order_index - b.order_index),
      })),
  };

  return <CourseEditorClient course={sorted} />;
}
