import { createClient } from "./supabase/server";

export async function checkAccess(
  userId: string,
  courseId: string
): Promise<boolean> {
  const supabase =
    await createClient();

  const { data } =
    await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("active", true)
      .single();

  return !!data;
}
