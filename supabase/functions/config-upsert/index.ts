import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import {
  createHandler,
  jsonResponse,
  sha256,
  validateAuth,
} from "../_shared/mod.ts";

const createSupabaseClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

Deno.serve(
  createHandler({ method: "POST" }, async (req) => {
    const supabase = createSupabaseClient();
    const authResult = await validateAuth(req, supabase);

    if ("error" in authResult) {
      return authResult.error;
    }

    const { config } = await req.json();

    if (!config) {
      return jsonResponse({ error: "config required" }, 400);
    }

    const configJson = JSON.stringify(config);
    const hash = await sha256(configJson);

    if (config.rotationId) {
      const { data: rotation, error: rotationError } = await supabase
        .from("rotations")
        .select("id")
        .eq("id", config.rotationId)
        .single();

      if (rotationError || !rotation) {
        return jsonResponse({ error: "Rotation not found" }, 400);
      }
    }

    const { error: upsertError } = await supabase
      .from("jobs_configs")
      .upsert(
        { hash, config, last_used_at: new Date().toISOString() },
        { onConflict: "hash" },
      );

    if (upsertError) {
      console.error("Config upsert error:", upsertError);
      return jsonResponse({ error: "Failed to save config" }, 500);
    }

    return jsonResponse({ success: true, hash });
  }),
);
