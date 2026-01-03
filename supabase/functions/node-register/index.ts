import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { createHandler, jsonResponse } from "../_shared/mod.ts";

const createSupabaseClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateClaimCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

interface RegisterRequest {
  hostname: string;
  totalCores: number;
  enabledCores: number;
  platform: string;
  version: string;
}

Deno.serve(
  createHandler({ method: "POST" }, async (req) => {
    const body = (await req
      .json()
      .catch(() => ({}))) as Partial<RegisterRequest>;
    const hostname = body.hostname || "WowLab Node";
    const totalCores = body.totalCores || 4;
    const enabledCores = body.enabledCores || totalCores;
    const platform = body.platform || "unknown";
    const version = body.version || null;

    const supabase = createSupabaseClient();
    const claimCode = generateClaimCode();

    const { data, error } = await supabase
      .from("user_nodes")
      .insert({
        claimCode,
        name: hostname,
        totalCores,
        maxParallel: enabledCores,
        platform,
        version,
        status: "pending",
      })
      .select("id, claimCode")
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse(data);
  }),
);
