import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CourseEditorClient from "@/components/course/CourseEditorClient";
import Link from "next/link";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles")
    .select("is_admin, is_super_admin").eq("id", user.id).single();
  if (!profile?.is_admin && !profile?.is_super_admin) redirect("/dashboard");

  const { data: course, error } = await supabase.from("courses").select(`
    id, title, slug, description, price_cents, level, duration_minutes,
    published, scheduled_at, thumbnail_url, promo_video_url,
    course_type, show_in_landing, show_in_store,
    modules (
      id, title, order_index,
      lessons ( id, title, video_url, position, is_free_preview )
    )
  `).eq("id", id).single();

  if (error) {
    return (
      <div style={{ padding: "40px 24px", maxWidth: 600 }}>
        <Link href="/admin/cursos" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "block", marginBottom: 24 }}>← Cursos</Link>
        <div style={{ padding: "20px", background: "rgba(232,0,74,0.08)", border: "1px solid rgba(232,0,74,0.2)", borderRadius: 12, color: "#E8004A" }}>
          <p style={{ fontWeight: 700, margin: "0 0 4px 0" }}>Error cargando el curso</p>
          <p style={{ fontSize: 13, margin: 0 }}>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!course) notFound();

  const sorted = {
    ...course,
    modules: [...(course.modules || [])]
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map(m => ({
        ...m,
        // Normalize: expose position as order_index for client
        lessons: [...(m.lessons || [])]
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          .map((l: any) => ({ ...l, order_index: l.position ?? 0 })),
      })),
  };

  return <CourseEditorClient course={sorted as any} />;
}
