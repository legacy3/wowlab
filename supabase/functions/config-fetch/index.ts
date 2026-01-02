import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
};

function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const url = new URL(req.url);
    const hash = url.searchParams.get("hash");

    if (!hash) {
      return jsonResponse({ error: "hash parameter required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("sim_configs")
      .select("config")
      .eq("hash", hash)
      .single();

    if (error || !data) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    // Update lastUsedAt for cache tracking
    await supabase
      .from("sim_configs")
      .update({ lastUsedAt: new Date().toISOString() })
      .eq("hash", hash);

    // Return with aggressive caching - configs are immutable by hash
    return jsonResponse(data.config, 200, {
      "Cache-Control": "public, max-age=31536000, immutable",
    });
  } catch (err) {
    console.error("config-fetch error:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});
