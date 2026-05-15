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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      description,
      price_cents,
      level,
      duration_minutes,
      published,
      scheduled_at,
      thumbnail_url,
      promo_video_url,
      course_type,
      show_in_landing,
      show_in_store,
      modules (
        id,
        title,
        order_index,
        lessons (
          id,
          title,
          video_url,
          position,
          is_free_preview
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error(
      "COURSE_FETCH_ERROR:",
      error
    );

    return (
      <pre>
        {JSON.stringify(
          error,
          null,
          2
        )}
      </pre>
    );
  }

  if (!course) {
    notFound();
  }

  const sorted = {
    ...course,

    modules: [...(course.modules || [])]
      .map((module) => ({
        ...module,

        order_index:
          module.order_index ?? 0,

        lessons: [
          ...(module.lessons || []),
        ]
          .map((lesson) => ({
            ...lesson,

            order_index:
              lesson.position ?? 0,
          }))
          .sort(
            (a, b) =>
              a.order_index -
              b.order_index
          ),
      }))
      .sort(
        (a, b) =>
          a.order_index -
          b.order_index
      ),
  };

  return (
    <CourseEditorClient
      course={sorted}
    />
  );
}
