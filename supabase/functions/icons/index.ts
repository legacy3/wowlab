import "@supabase/functions-js/edge-runtime.d.ts";
const WOWHEAD_BASE = "https://wow.zamimg.com/images/wow/icons";
const VALID_SIZES = ["small", "medium", "large"];

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const { pathname } = url;
  // Supabase strips the function name, so we get: /{size}/{filename}.jpg
  const pathParts = pathname.split("/").filter(Boolean);
  const size = pathParts[1];
  const filename = pathParts[2];
  if (!size || !filename) {
    return new Response("Missing size or filename", {
      status: 400,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
  if (!VALID_SIZES.includes(size)) {
    return new Response("Invalid size. Use: small, medium, or large", {
      status: 400,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  try {
    const iconUrl = `${WOWHEAD_BASE}/${size}/${filename}`;
    const response = await fetch(iconUrl);

    if (!response.ok) {
      return new Response("Icon not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(`Failed to fetch icon: ${error.message}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
});
