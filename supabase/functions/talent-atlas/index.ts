import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { options, text } from "../_shared/response.ts";

const WOWHEAD_BASE = "https://wow.zamimg.com/images/wow/TextureAtlas/live";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return options();
  }

  const url = new URL(req.url);
  const { pathname } = url;
  const pathParts = pathname.split("/").filter(Boolean);
  const filename = pathParts[1];

  if (!filename) {
    return text("Missing filename", 400);
  }

  try {
    const atlasUrl = `${WOWHEAD_BASE}/${filename}`;
    const response = await fetch(atlasUrl);

    if (!response.ok) {
      return text("Atlas not found", 404);
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return text(`Failed to fetch atlas: ${(err as Error).message}`, 500);
  }
});
