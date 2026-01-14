import { env } from "@/lib/env";

export async function createShortUrl(path: string): Promise<string> {
  const res = await fetch("/api/go", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to shorten URL");
  }

  const { slug } = await res.json();

  return `${env.APP_URL}/go/${slug}`;
}
