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

  if (!payload.chunkId || !payload.result) {
    return json({ error: "chunkId and result required" }, 400);
  }

  const supabase = createAdmin();

  const { data: node } = await supabase
    .from("nodes")
    .select("id")
    .eq("public_key", auth.node.publicKey)
    .single();

  if (!node) {
    return json({ error: "Node not found" }, 404);
  }

  const { data, error } = await supabase
    .from("jobs_chunks")
    .update({
      status: "completed",
      result: payload.result,
      completed_at: new Date().toISOString(),
    })
    .eq("id", payload.chunkId)
    .eq("node_id", node.id)
    .eq("status", "running")
    .select("id, job_id")
    .single();

  if (error) {
    const { data: existing } = await supabase
      .from("jobs_chunks")
      .select("id, status, node_id")
      .eq("id", payload.chunkId)
      .single();

    if (!existing) {
      return json({ error: "Chunk not found" }, 404);
    }

    if (existing.node_id !== node.id) {
      return json({ error: "Chunk not owned by this node" }, 403);
    }

    if (existing.status === "completed") {
      return json({
        success: true,
        alreadyCompleted: true,
        jobComplete: false,
      });
    }

    return json({ error: error.message }, 400);
  }

  const { count: pendingCount } = await supabase
    .from("jobs_chunks")
    .select("id", { count: "exact", head: true })
    .eq("job_id", data.job_id)
    .neq("status", "completed");

  if (pendingCount === 0) {
    await supabase
      .from("jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.job_id);

    return json({ success: true, jobComplete: true });
  }

  await supabase
    .from("jobs")
    .update({ status: "running" })
    .eq("id", data.job_id)
    .eq("status", "pending");

  return json({ success: true, jobComplete: false });
});
