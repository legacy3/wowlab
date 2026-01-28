import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { options, text } from "../_shared/response.ts";

const WOWHEAD_BASE = "https://wow.zamimg.com/images/wow/icons";
const VALID_SIZES = ["small", "medium", "large"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return options();
  }

  const url = new URL(req.url);
  const { pathname } = url;
  const pathParts = pathname.split("/").filter(Boolean);
  const size = pathParts[1];
  const filename = pathParts[2];

  if (!size || !filename) {
    return text("Missing size or filename", 400);
  }

  if (!VALID_SIZES.includes(size)) {
    return text("Invalid size. Use: small, medium, or large", 400);
  }

  try {
    const iconUrl = `${WOWHEAD_BASE}/${size}/${filename}`;
    const response = await fetch(iconUrl);

    if (!response.ok) {
      return text("Icon not found", 404);
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return text(`Failed to fetch icon: ${(err as Error).message}`, 500);
  }
});
