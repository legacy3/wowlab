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
    const { chunkId, result } = await req.json();

    if (!chunkId || !result) {
      return jsonResponse({ error: "chunkId and result required" }, 400);
    }

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("sim_chunks")
      .update({
        status: "completed",
        result,
        completedAt: new Date().toISOString(),
      })
      .eq("id", chunkId)
      .eq("status", "running")
      .select("id, jobId, iterations")
      .single();

    if (error) {
      const { data: existing } = await supabase
        .from("sim_chunks")
        .select("id, status")
        .eq("id", chunkId)
        .single();

      if (existing?.status === "completed") {
        return jsonResponse({
          success: true,
          alreadyCompleted: true,
          jobComplete: false,
        });
      }

      return jsonResponse({ error: error.message }, 400);
    }

    if (!data) {
      return jsonResponse({ error: "Chunk not found or not running" }, 404);
    }

    const { count: pendingCount } = await supabase
      .from("sim_chunks")
      .select("id", { count: "exact", head: true })
      .eq("jobId", data.jobId)
      .neq("status", "completed");

    let jobComplete = false;

    if (pendingCount === 0) {
      jobComplete = true;

      const { data: chunks } = await supabase
        .from("sim_chunks")
        .select("result, iterations")
        .eq("jobId", data.jobId)
        .eq("status", "completed");

      if (chunks && chunks.length > 0) {
        let totalIterations = 0;
        let weightedDps = 0;
        let minDps = Infinity;
        let maxDps = 0;

        for (const chunk of chunks) {
          const r = chunk.result as {
            meanDps?: number;
            minDps?: number;
            maxDps?: number;
          } | null;
          if (r?.meanDps) {
            totalIterations += chunk.iterations;
            weightedDps += r.meanDps * chunk.iterations;
            if (r.minDps !== undefined) minDps = Math.min(minDps, r.minDps);
            if (r.maxDps !== undefined) maxDps = Math.max(maxDps, r.maxDps);
          }
        }

        const aggregatedResult = {
          meanDps: totalIterations > 0 ? weightedDps / totalIterations : 0,
          minDps: minDps === Infinity ? 0 : minDps,
          maxDps,
          totalIterations,
          chunksCompleted: chunks.length,
        };

        await supabase
          .from("sim_jobs")
          .update({
            status: "completed",
            result: aggregatedResult,
            completedIterations: totalIterations,
            completedAt: new Date().toISOString(),
          })
          .eq("id", data.jobId);

        await supabase.from("sim_chunks").delete().eq("jobId", data.jobId);
      }
    } else {
      await supabase
        .from("sim_jobs")
        .update({ status: "running" })
        .eq("id", data.jobId)
        .eq("status", "pending");
    }

    return jsonResponse({
      success: true,
      jobComplete,
    });
  }),
);
