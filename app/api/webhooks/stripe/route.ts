import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { courseId, userId } = session.metadata!;
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    await supabase.from("orders").insert({
      user_id: userId, course_id: courseId,
      stripe_session_id: session.id, status: "paid", amount_cents: session.amount_total,
    });
    await supabase.from("enrollments").insert({ user_id: userId, course_id: courseId, active: true });
  }

  return NextResponse.json({ received: true });
}

export const runtime = "nodejs";
