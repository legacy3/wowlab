import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 20;

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { nodeId, batchSize: requestedBatchSize } = await req.json();

    if (!nodeId) {
      return jsonResponse({ error: "nodeId required" }, 400);
    }

    const batchSize = Math.min(
      Math.max(1, requestedBatchSize || DEFAULT_BATCH_SIZE),
      MAX_BATCH_SIZE,
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get node info
    const { data: node, error: nodeError } = await supabase
      .from("user_nodes")
      .select("id, userId")
      .eq("id", nodeId)
      .single();

    if (nodeError || !node) {
      return jsonResponse({ error: "Node not found" }, 404);
    }

    // Get node permissions
    const { data: permissions } = await supabase
      .from("user_nodes_permissions")
      .select("accessType, targetId")
      .eq("nodeId", nodeId);

    const perms = permissions || [];
    const isPublic = perms.some((p) => p.accessType === "public");
    const sharedWithUsers = perms
      .filter((p) => p.accessType === "user" && p.targetId)
      .map((p) => p.targetId);
    const allowedOwners = [node.userId, ...sharedWithUsers];

    // Find pending chunks
    const { data: pendingChunks, error: findError } = await supabase
      .from("sim_chunks")
      .select("id, jobId, configHash, iterations, seedOffset")
      .is("nodeId", null)
      .eq("status", "pending")
      .order("createdAt", { ascending: true })
      .limit(50);

    if (findError || !pendingChunks || pendingChunks.length === 0) {
      return jsonResponse({ chunks: [], configHash: null });
    }

    // Get job owners for permission check
    const jobIds = [...new Set(pendingChunks.map((c) => c.jobId))];
    const { data: jobs } = await supabase
      .from("sim_jobs")
      .select("id, userId")
      .in("id", jobIds);

    const jobOwnerMap = new Map((jobs || []).map((j) => [j.id, j.userId]));

    // Filter by permission
    const allowedChunks = isPublic
      ? pendingChunks
      : pendingChunks.filter((c) => {
          const jobOwner = jobOwnerMap.get(c.jobId);
          return jobOwner && allowedOwners.includes(jobOwner);
        });

    if (allowedChunks.length === 0) {
      return jsonResponse({ chunks: [], configHash: null });
    }

    // Claim with optimistic lock
    const toClaim = allowedChunks.slice(0, batchSize);
    const chunkIds = toClaim.map((c) => c.id);

    const { data: claimedChunks, error: updateError } = await supabase
      .from("sim_chunks")
      .update({
        nodeId,
        status: "running",
        claimedAt: new Date().toISOString(),
      })
      .in("id", chunkIds)
      .is("nodeId", null)
      .select("id, configHash, iterations, seedOffset");

    if (updateError || !claimedChunks || claimedChunks.length === 0) {
      return jsonResponse({ chunks: [], configHash: null });
    }

    // Return only configHash - node fetches config separately via config-fetch
    const configHash = claimedChunks[0].configHash;

    return jsonResponse({
      chunks: claimedChunks.map((c) => ({
        id: c.id,
        iterations: c.iterations,
        seedOffset: c.seedOffset,
      })),
      configHash,
      // Note: config field removed - node fetches via config-fetch endpoint
    });
  } catch (err) {
    console.error("chunk-claim error:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});
