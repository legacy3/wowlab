import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { createHandler, jsonResponse, validateAuth } from "../_shared/mod.ts";

const createSupabaseClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

const CHUNK_SIZE = 1000;

Deno.serve(
  createHandler({ method: "POST" }, async (req) => {
    const supabase = createSupabaseClient();
    const authResult = await validateAuth(req, supabase);

    if ("error" in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const { configHash, iterations } = await req.json();

    if (!configHash || !iterations) {
      return jsonResponse({ error: "configHash and iterations required" }, 400);
    }

    const { data: configExists, error: configError } = await supabase
      .from("sim_configs")
      .select("hash")
      .eq("hash", configHash)
      .single();

    if (configError || !configExists) {
      return jsonResponse(
        { error: "Config not found. Upload via config-upsert first." },
        400,
      );
    }

    const { data: job, error: jobError } = await supabase
      .from("sim_jobs")
      .insert({
        userId: user.id,
        configHash,
        totalIterations: iterations,
        status: "pending",
      })
      .select("id")
      .single();

    if (jobError || !job) {
      console.error("Job creation error:", jobError);
      return jsonResponse(
        { error: jobError?.message || "Failed to create job" },
        500,
      );
    }

    const numChunks = Math.ceil(iterations / CHUNK_SIZE);
    const chunks = [];

    for (let i = 0; i < numChunks; i++) {
      const chunkIterations = Math.min(CHUNK_SIZE, iterations - i * CHUNK_SIZE);
      chunks.push({
        jobId: job.id,
        nodeId: null,
        configHash,
        iterations: chunkIterations,
        seedOffset: i * CHUNK_SIZE,
        status: "pending",
      });
    }

    const { error: chunksError } = await supabase
      .from("sim_chunks")
      .insert(chunks);

    if (chunksError) {
      console.error("Chunks creation error:", chunksError);
      await supabase.from("sim_jobs").delete().eq("id", job.id);
      return jsonResponse({ error: "Failed to create chunks" }, 500);
    }

    const channel = supabase.channel("pending-chunks");
    await channel.send({
      type: "broadcast",
      event: "work-available",
      payload: {
        jobId: job.id,
        userId: user.id,
        configHash,
        chunks: numChunks,
        reason: "new-job",
      },
    });
    await supabase.removeChannel(channel);

    return jsonResponse({
      jobId: job.id,
      chunks: numChunks,
      queued: true,
    });
  }),
);
