import { SignJWT } from "jose";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Centrifugo not configured" },
      { status: 500 },
    );
  }

  const token = await new SignJWT({ sub: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));

  return NextResponse.json({ token });
}
