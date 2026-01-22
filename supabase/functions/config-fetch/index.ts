import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { options, json } from "../_shared/response.ts";
import { createAdmin } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return options();
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const url = new URL(req.url);
  const hash = url.searchParams.get("hash");

  if (!hash) {
    return json({ error: "hash parameter required" }, 400);
  }

  const supabase = createAdmin();

  const { data, error } = await supabase
    .from("jobs_configs")
    .select("config")
    .eq("hash", hash)
    .single();

  if (error || !data) {
    return json({ error: "Not found" }, 404);
  }

  await supabase
    .from("jobs_configs")
    .update({ last_used_at: new Date().toISOString() })
    .eq("hash", hash);

  return new Response(JSON.stringify(data.config), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=31536000, immutable",
      ...corsHeaders,
    },
  });
});
