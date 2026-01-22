import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { options, json } from "../_shared/response.ts";
import { createAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return options();
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return json({ error: "id parameter required" }, 400);
  }

  const supabase = createAdmin();

  const { data, error } = await supabase
    .from("rotations")
    .select("id, script, checksum")
    .eq("id", id)
    .single();

  if (error || !data) {
    return json({ error: "Not found" }, 404);
  }

  return json({
    id: data.id,
    script: data.script,
    checksum: data.checksum,
  });
});
