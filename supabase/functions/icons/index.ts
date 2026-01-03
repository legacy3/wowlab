import "@supabase/functions-js/edge-runtime.d.ts";
import { optionsResponse, textResponse } from "../_shared/mod.ts";

const WOWHEAD_BASE = "https://wow.zamimg.com/images/wow/icons";
const VALID_SIZES = ["small", "medium", "large"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return optionsResponse();
  }

  const url = new URL(req.url);
  const { pathname } = url;
  const pathParts = pathname.split("/").filter(Boolean);
  const size = pathParts[1];
  const filename = pathParts[2];

  if (!size || !filename) {
    return textResponse("Missing size or filename", 400);
  }

  if (!VALID_SIZES.includes(size)) {
    return textResponse("Invalid size. Use: small, medium, or large", 400);
  }

  try {
    const iconUrl = `${WOWHEAD_BASE}/${size}/${filename}`;
    const response = await fetch(iconUrl);

    if (!response.ok) {
      return textResponse("Icon not found", 404);
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return textResponse(`Failed to fetch icon: ${error.message}`, 500);
  }
});
