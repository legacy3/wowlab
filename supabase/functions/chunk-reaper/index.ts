import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

// Chunks claimed more than this long ago are considered stale
const STALE_THRESHOLD_MINUTES = 5;

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

  // Allow GET for cron triggers, POST for manual invocation
  if (req.method !== "POST" && req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find and reset stale chunks (claimed but not completed within threshold)
    const staleThreshold = new Date(
      Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000,
    ).toISOString();

    const { data: staleChunks, error: findError } = await supabase
      .from("sim_chunks")
      .select("id, jobId, nodeId")
      .eq("status", "running")
      .lt("claimedAt", staleThreshold);

    if (findError) {
      console.error("Error finding stale chunks:", findError);
      return jsonResponse({ error: findError.message }, 500);
    }

    if (!staleChunks || staleChunks.length === 0) {
      // No stale chunks - check if there are any pending chunks to broadcast about
      const { count: pendingCount } = await supabase
        .from("sim_chunks")
        .select("id", { count: "exact", head: true })
        .is("nodeId", null)
        .eq("status", "pending");

      if ((pendingCount ?? 0) > 0) {
        // Broadcast to wake up any idle nodes
        const channel = supabase.channel("pending-chunks");
        await channel.send({
          type: "broadcast",
          event: "work-available",
          payload: { reason: "sweep", pendingChunks: pendingCount },
        });
        await supabase.removeChannel(channel);

        return jsonResponse({
          staleReset: 0,
          broadcast: true,
          pendingChunks: pendingCount,
        });
      }

      return jsonResponse({ staleReset: 0, broadcast: false });
    }

    // Reset stale chunks
    const staleIds = staleChunks.map((c) => c.id);
    const { error: resetError } = await supabase
      .from("sim_chunks")
      .update({
        nodeId: null,
        status: "pending",
        claimedAt: null,
      })
      .in("id", staleIds);

    if (resetError) {
      console.error("Error resetting stale chunks:", resetError);
      return jsonResponse({ error: resetError.message }, 500);
    }

    console.log(`Reset ${staleChunks.length} stale chunks`);

    // Log which nodes had stale chunks (for debugging)
    const affectedNodes = [...new Set(staleChunks.map((c) => c.nodeId))];
    console.log(`Affected nodes: ${affectedNodes.join(", ")}`);

    // Broadcast to notify nodes that work is available
    const channel = supabase.channel("pending-chunks");
    await channel.send({
      type: "broadcast",
      event: "work-available",
      payload: {
        reason: "stale-recovery",
        chunksRecovered: staleChunks.length,
      },
    });
    await supabase.removeChannel(channel);

    return jsonResponse({
      staleReset: staleChunks.length,
      affectedNodes: affectedNodes.length,
      broadcast: true,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});
