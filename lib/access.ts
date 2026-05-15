import { createClient } from "./supabase/server";

export type CourseAccess = {
  isAdmin: boolean;
  hasEnrollment: boolean;
  hasAccess: boolean;
};

export async function getCourseAccess(
  userId: string,
  courseId: string
): Promise<CourseAccess> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", userId)
    .maybeSingle();

  const isAdmin = Boolean(profile?.is_admin || profile?.is_super_admin);

  if (isAdmin) {
    return {
      isAdmin: true,
      hasEnrollment: false,
      hasAccess: true,
    };
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();

  return {
    isAdmin: false,
    hasEnrollment: Boolean(enrollment),
    hasAccess: Boolean(enrollment),
  };
}

export async function checkAccess(
  userId: string,
  courseId: string
): Promise<boolean> {
  const access = await getCourseAccess(userId, courseId);
  return access.hasAccess;
}
