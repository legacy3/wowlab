import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { options, json } from "../_shared/response.ts";
import { createAdmin } from "../_shared/supabase.ts";
import { verifyNode } from "../_shared/ed25519.ts";

const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 20;

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
  const batchSize = Math.min(
    Math.max(1, payload.batchSize || DEFAULT_BATCH_SIZE),
    MAX_BATCH_SIZE,
  );

  const supabase = createAdmin();

  const { data: node, error: nodeError } = await supabase
    .from("nodes")
    .select("id, user_id")
    .eq("public_key", auth.node.publicKey)
    .single();

  if (nodeError || !node) {
    return json({ error: "Node not found" }, 404);
  }

  const { data: permissions } = await supabase
    .from("nodes_permissions")
    .select("access_type, target_id")
    .eq("node_id", node.id);

  const perms = permissions || [];
  const isPublic = perms.some((p) => p.access_type === "public");
  const sharedWithUsers = perms
    .filter((p) => p.access_type === "user" && p.target_id)
    .map((p) => p.target_id);
  const allowedOwners = [node.user_id, ...sharedWithUsers];

  const { data: pendingChunks, error: findError } = await supabase
    .from("jobs_chunks")
    .select("id, job_id, config_hash, iterations, seed_offset")
    .is("node_id", null)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (findError || !pendingChunks || pendingChunks.length === 0) {
    return json({ chunks: [], configHash: null });
  }

  const jobIds = [...new Set(pendingChunks.map((c) => c.job_id))];
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, user_id")
    .in("id", jobIds);

  const jobOwnerMap = new Map((jobs || []).map((j) => [j.id, j.user_id]));

  const allowedChunks = isPublic
    ? pendingChunks
    : pendingChunks.filter((c) => {
        const jobOwner = jobOwnerMap.get(c.job_id);
        return jobOwner && allowedOwners.includes(jobOwner);
      });

  if (allowedChunks.length === 0) {
    return json({ chunks: [], configHash: null });
  }

  const toClaim = allowedChunks.slice(0, batchSize);
  const chunkIds = toClaim.map((c) => c.id);

  const { data: claimedChunks, error: updateError } = await supabase
    .from("jobs_chunks")
    .update({
      node_id: node.id,
      status: "running",
      claimed_at: new Date().toISOString(),
    })
    .in("id", chunkIds)
    .is("node_id", null)
    .select("id, config_hash, iterations, seed_offset");

  if (updateError || !claimedChunks || claimedChunks.length === 0) {
    return json({ chunks: [], configHash: null });
  }

  return json({
    chunks: claimedChunks.map((c) => ({
      id: c.id,
      iterations: c.iterations,
      seedOffset: c.seed_offset,
    })),
    configHash: claimedChunks[0].config_hash,
  });
});
