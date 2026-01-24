import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  // TODO Env-URL
  const response = await fetch("https://sentinel.wowlab.gg/metrics", {
    cache: "no-store",
    headers: { "User-Agent": "wowlab-portal" },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch sentinel metrics" },
      { status: 502 },
    );
  }

  const text = await response.text();

  return new NextResponse(text, {
    headers: { "Content-Type": "text/plain" },
  });
}
