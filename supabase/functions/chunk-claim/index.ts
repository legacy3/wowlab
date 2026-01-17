import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { createHandler, jsonResponse } from "../_shared/mod.ts";

const createSupabaseClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 20;

Deno.serve(
  createHandler({ method: "POST" }, async (req) => {
    const { nodeId, batchSize: requestedBatchSize } = await req.json();

    if (!nodeId) {
      return jsonResponse({ error: "nodeId required" }, 400);
    }

    const batchSize = Math.min(
      Math.max(1, requestedBatchSize || DEFAULT_BATCH_SIZE),
      MAX_BATCH_SIZE,
    );

    const supabase = createSupabaseClient();

    const { data: node, error: nodeError } = await supabase
      .from("nodes")
      .select("id, user_id")
      .eq("id", nodeId)
      .single();

    if (nodeError || !node) {
      return jsonResponse({ error: "Node not found" }, 404);
    }

    const { data: permissions } = await supabase
      .from("nodes_permissions")
      .select("access_type, target_id")
      .eq("node_id", nodeId);

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
      return jsonResponse({ chunks: [], configHash: null });
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
      return jsonResponse({ chunks: [], configHash: null });
    }

    const toClaim = allowedChunks.slice(0, batchSize);
    const chunkIds = toClaim.map((c) => c.id);

    const { data: claimedChunks, error: updateError } = await supabase
      .from("jobs_chunks")
      .update({
        node_id: nodeId,
        status: "running",
        claimed_at: new Date().toISOString(),
      })
      .in("id", chunkIds)
      .is("node_id", null)
      .select("id, config_hash, iterations, seed_offset");

    if (updateError || !claimedChunks || claimedChunks.length === 0) {
      return jsonResponse({ chunks: [], configHash: null });
    }

    const configHash = claimedChunks[0].config_hash;

    return jsonResponse({
      chunks: claimedChunks.map((c) => ({
        id: c.id,
        iterations: c.iterations,
        seedOffset: c.seed_offset,
      })),
      configHash,
    });
  }),
);
