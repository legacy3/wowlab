import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { options, json } from "../_shared/response.ts";
import { createAdmin } from "../_shared/supabase.ts";
import { validateUser } from "../_shared/auth.ts";

const CHUNK_SIZE = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return options();
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabase = createAdmin();
  const authResult = await validateUser(req, supabase);

  if ("error" in authResult) {
    return authResult.error;
  }

  const { user } = authResult;
  const { configHash, iterations } = await req.json();

  if (!configHash || !iterations) {
    return json({ error: "configHash and iterations required" }, 400);
  }

  const { data: configExists, error: configError } = await supabase
    .from("jobs_configs")
    .select("hash")
    .eq("hash", configHash)
    .single();

  if (configError || !configExists) {
    return json(
      { error: "Config not found. Upload via config-upsert first." },
      400,
    );
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      config_hash: configHash,
      total_iterations: iterations,
      status: "pending",
    })
    .select("id")
    .single();

  if (jobError || !job) {
    console.error("Job creation error:", jobError);
    return json({ error: jobError?.message || "Failed to create job" }, 500);
  }

  const numChunks = Math.ceil(iterations / CHUNK_SIZE);
  const chunks = [];

  for (let i = 0; i < numChunks; i++) {
    const chunkIterations = Math.min(CHUNK_SIZE, iterations - i * CHUNK_SIZE);
    chunks.push({
      job_id: job.id,
      node_id: null,
      config_hash: configHash,
      iterations: chunkIterations,
      seed_offset: i * CHUNK_SIZE,
      status: "pending",
    });
  }

  const { error: chunksError } = await supabase
    .from("jobs_chunks")
    .insert(chunks);

  if (chunksError) {
    console.error("Chunks creation error:", chunksError);
    await supabase.from("jobs").delete().eq("id", job.id);
    return json({ error: "Failed to create chunks" }, 500);
  }

  return json({
    jobId: job.id,
    chunks: numChunks,
  });
});
