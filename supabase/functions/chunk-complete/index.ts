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
      .from("jobs_chunks")
      .update({
        status: "completed",
        result,
        completed_at: new Date().toISOString(),
      })
      .eq("id", chunkId)
      .eq("status", "running")
      .select("id, job_id, iterations")
      .single();

    if (error) {
      const { data: existing } = await supabase
        .from("jobs_chunks")
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
      .from("jobs_chunks")
      .select("id", { count: "exact", head: true })
      .eq("job_id", data.job_id)
      .neq("status", "completed");

    let jobComplete = false;

    if (pendingCount === 0) {
      jobComplete = true;

      const { data: chunks } = await supabase
        .from("jobs_chunks")
        .select("result, iterations")
        .eq("job_id", data.job_id)
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
          .from("jobs")
          .update({
            status: "completed",
            result: aggregatedResult,
            completed_iterations: totalIterations,
            completed_at: new Date().toISOString(),
          })
          .eq("id", data.job_id);

        await supabase.from("jobs_chunks").delete().eq("job_id", data.job_id);
      }
    } else {
      await supabase
        .from("jobs")
        .update({ status: "running" })
        .eq("id", data.job_id)
        .eq("status", "pending");
    }

    return jsonResponse({
      success: true,
      jobComplete,
    });
  }),
);
