import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { createHandler, jsonResponse } from "../_shared/mod.ts";

const createSupabaseClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

Deno.serve(
  createHandler({ method: "GET" }, async (req) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return jsonResponse({ error: "id parameter required" }, 400);
    }

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("rotations")
      .select("id, script, checksum")
      .eq("id", id)
      .single();

    if (error || !data) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    return jsonResponse({
      id: data.id,
      script: data.script,
      checksum: data.checksum,
    });
  }),
);
