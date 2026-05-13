import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(
  request: Request
) {
  const cookieStore =
    await cookies();

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,

      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY!,

      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },

          setAll(
            cookiesToSet: any[]
          ) {
            try {
              cookiesToSet.forEach(
                ({
                  name,
                  value,
                  options,
                }) =>
                  cookieStore.set(
                    name,
                    value,
                    options
                  )
              );
            } catch {}
          },
        },
      }
    );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "No autenticado",
      },
      { status: 401 }
    );
  }

  const { courseId } =
    await request.json();

  const { data: course } =
    await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

  if (!course) {
    return NextResponse.json(
      {
        error:
          "Curso no encontrado",
      },
      { status: 404 }
    );
  }

  const session =
    await stripe.checkout.sessions.create(
      {
        payment_method_types: [
          "card",
        ],

        line_items: [
          {
            price_data: {
              currency: "mxn",

              product_data: {
                name: course.title,

                description:
                  course.description ||
                  undefined,
              },

              unit_amount:
                course.price_cents,
            },

            quantity: 1,
          },
        ],

        mode: "payment",

        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1`,

        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cursos/${course.slug}`,

        metadata: {
          courseId: course.id,
          userId: user.id,
        },

        customer_email:
          user.email,
      }
    );

  return NextResponse.json({
    url: session.url,
  });
}
