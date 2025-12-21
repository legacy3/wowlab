import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const body = await request.json();
  const { path } = body as { path: string };

  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("get_or_create_short_url", {
    p_target_url: path,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to create short URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({ slug: data });
}
