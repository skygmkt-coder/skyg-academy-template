import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();

  const body = await req.json();

  const { data, error } = await supabase
    .from("courses")
    .update({
      title: body.title,
      description: body.description,
      price_cents: body.price_cents,
      level: body.level,
      duration_minutes: body.duration_minutes,
      published: body.published,
      scheduled_at: body.scheduled_at,
      thumbnail_url: body.thumbnail_url,
      promo_video_url: body.promo_video_url,
      show_in_landing: body.show_in_landing,
      show_in_store: body.show_in_store,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();

  const body = await req.json();

  switch (body.action) {
    case "add_module": {
      const { data, error } = await supabase
        .from("modules")
        .insert({
          course_id: id,
          title: body.title,
          order_index: 0,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ module: data });
    }

    case "update_module": {
      const { error } = await supabase
        .from("modules")
        .update({
          title: body.title,
        })
        .eq("id", body.module_id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    case "delete_module": {
      const { error } = await supabase
        .from("modules")
        .delete()
        .eq("id", body.module_id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    case "add_lesson": {
      const { data, error } = await supabase
        .from("lessons")
        .insert({
          module_id: body.module_id,
          title: body.title,
          video_url: body.video_url,
          is_free_preview: body.is_free_preview,
          order_index: 0,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ lesson: data });
    }

    case "update_lesson": {
      const { error } = await supabase
        .from("lessons")
        .update({
          title: body.title,
          video_url: body.video_url,
          is_free_preview: body.is_free_preview,
        })
        .eq("id", body.lesson_id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    case "delete_lesson": {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", body.lesson_id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    case "delete_course": {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
  }
}
