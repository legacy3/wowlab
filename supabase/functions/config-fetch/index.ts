import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { createHandler, jsonResponse } from "../_shared/mod.ts";

const createSupabaseClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

Deno.serve(
  createHandler({ method: "GET" }, async (req) => {
    const url = new URL(req.url);
    const hash = url.searchParams.get("hash");

    if (!hash) {
      return jsonResponse({ error: "hash parameter required" }, 400);
    }

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("jobs_configs")
      .select("config")
      .eq("hash", hash)
      .single();

    if (error || !data) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    await supabase
      .from("jobs_configs")
      .update({ last_used_at: new Date().toISOString() })
      .eq("hash", hash);

    return jsonResponse(data.config, 200, {
      "Cache-Control": "public, max-age=31536000, immutable",
    });
  }),
);
