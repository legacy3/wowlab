import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { createHandler, jsonResponse } from "../_shared/mod.ts";

const createSupabaseClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

Deno.serve(
  createHandler({ method: "POST" }, async (req) => {
    const { nodeId, status } = await req.json();

    if (!nodeId) {
      return jsonResponse({ error: "nodeId required" }, 400);
    }

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("nodes")
      .update({
        status: status || "online",
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", nodeId)
      .not("user_id", "is", null)
      .select("id, name, max_parallel, status")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return jsonResponse({ error: "Node not found or not claimed" }, 404);
      }
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse({
      id: data.id,
      name: data.name,
      maxParallel: data.max_parallel,
      status: data.status,
    });
  }),
);
