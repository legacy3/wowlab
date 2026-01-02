import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    const { config } = await req.json();

    if (!config) {
      return jsonResponse({ error: "config required" }, 400);
    }

    // Calculate hash server-side (single source of truth)
    const configJson = JSON.stringify(config);
    const hash = await sha256(configJson);

    // Verify rotationId exists if provided
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

    // Upsert config
    const { error: upsertError } = await supabase
      .from("sim_configs")
      .upsert(
        { hash, config, lastUsedAt: new Date().toISOString() },
        { onConflict: "hash" },
      );

    if (upsertError) {
      console.error("Config upsert error:", upsertError);
      return jsonResponse({ error: "Failed to save config" }, 500);
    }

    return jsonResponse({ success: true, hash });
  } catch (err) {
    console.error("config-upsert error:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});
