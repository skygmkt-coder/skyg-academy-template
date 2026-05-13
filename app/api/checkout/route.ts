import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Payments disabled in template mode",
    },
    { status: 503 }
  );
}
