import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { options, json } from "../_shared/response.ts";
import { createAdmin } from "../_shared/supabase.ts";
import { verifyNode } from "../_shared/ed25519.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return options();
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const body = await req.text();
  const auth = await verifyNode(req, body);

  if ("error" in auth) {
    return auth.error;
  }

  const payload = JSON.parse(body || "{}");
  const supabase = createAdmin();

  const { data, error } = await supabase
    .from("nodes")
    .update({
      status: payload.status || "online",
      last_seen_at: new Date().toISOString(),
    })
    .eq("public_key", auth.node.publicKey)
    .not("user_id", "is", null)
    .select("id, name, max_parallel, status")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return json({ error: "Node not found or not claimed" }, 404);
    }
    return json({ error: error.message }, 400);
  }

  return json({
    id: data.id,
    name: data.name,
    maxParallel: data.max_parallel,
    status: data.status,
  });
});
