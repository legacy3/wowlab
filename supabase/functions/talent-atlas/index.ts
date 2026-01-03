import "@supabase/functions-js/edge-runtime.d.ts";
import { optionsResponse, textResponse } from "../_shared/mod.ts";

const WOWHEAD_BASE = "https://wow.zamimg.com/images/wow/TextureAtlas/live";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return optionsResponse();
  }

  const url = new URL(req.url);
  const { pathname } = url;
  const pathParts = pathname.split("/").filter(Boolean);
  const filename = pathParts[1];

  if (!filename) {
    return textResponse("Missing filename", 400);
  }

  try {
    const atlasUrl = `${WOWHEAD_BASE}/${filename}`;
    const response = await fetch(atlasUrl);

    if (!response.ok) {
      return textResponse("Atlas not found", 404);
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return textResponse(`Failed to fetch atlas: ${error.message}`, 500);
  }
});
