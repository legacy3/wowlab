import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { encodeHex } from "@std/encoding";
import { options, json } from "../_shared/response.ts";
import { createAdmin } from "../_shared/supabase.ts";
import { validateUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return options();
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabase = createAdmin();
  const authResult = await validateUser(req, supabase);

  if ("error" in authResult) {
    return authResult.error;
  }

  const { config } = await req.json();

  if (!config) {
    return json({ error: "config required" }, 400);
  }

  const configBytes = new TextEncoder().encode(JSON.stringify(config));
  const hash = encodeHex(await crypto.subtle.digest("SHA-256", configBytes));

  if (config.rotationId) {
    const { data: rotation, error: rotationError } = await supabase
      .from("rotations")
      .select("id")
      .eq("id", config.rotationId)
      .single();

    if (rotationError || !rotation) {
      return json({ error: "Rotation not found" }, 400);
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
    return json({ error: "Failed to save config" }, 500);
  }

  return json({ success: true, hash });
});
