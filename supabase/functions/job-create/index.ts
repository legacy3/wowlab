import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const CHUNK_SIZE = 1000;

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    const { configHash, iterations } = await req.json();

    if (!configHash || !iterations) {
      return jsonResponse({ error: "configHash and iterations required" }, 400);
    }

    // Verify config exists in sim_configs table
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

    // Broadcast to notify listening nodes
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
  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});
