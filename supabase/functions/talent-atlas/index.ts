import "@supabase/functions-js/edge-runtime.d.ts";

const WOWHEAD_BASE = "https://wow.zamimg.com/images/wow/TextureAtlas/live";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const { pathname } = url;

  // Supabase strips the function name, so we get: /{filename}.webp
  const pathParts = pathname.split("/").filter(Boolean);
  const filename = pathParts[1];

  if (!filename) {
    return new Response("Missing filename", {
      status: 400,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  try {
    const atlasUrl = `${WOWHEAD_BASE}/${filename}`;
    const response = await fetch(atlasUrl);

    if (!response.ok) {
      return new Response("Atlas not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(`Failed to fetch atlas: ${error.message}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
});
