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
      .from("user_nodes")
      .update({
        status: status || "online",
        lastSeenAt: new Date().toISOString(),
      })
      .eq("id", nodeId)
      .not("userId", "is", null)
      .select("id, name, maxParallel, status")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return jsonResponse({ error: "Node not found or not claimed" }, 404);
      }
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse(data);
  }),
);
