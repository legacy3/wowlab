import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { options, json } from "../_shared/response.ts";
import { createAdmin } from "../_shared/supabase.ts";
import { verifyNode, deriveClaimCode } from "../_shared/ed25519.ts";

interface RegisterRequest {
  hostname: string;
  totalCores: number;
  enabledCores: number;
  platform: string;
  version: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return options();
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const body = await req.text();
  const auth = await verifyNode(req, body);

  if ("error" in auth) {
    return auth.error;
  }

  const payload = JSON.parse(body || "{}") as Partial<RegisterRequest>;
  const supabase = createAdmin();

  const { data: existing } = await supabase
    .from("nodes")
    .select("id, claim_code, user_id")
    .eq("public_key", auth.node.publicKey)
    .single();

  if (existing) {
    return json({
      id: existing.id,
      claimCode: existing.claim_code,
      claimed: existing.user_id !== null,
    });
  }

  const claimCode = await deriveClaimCode(auth.node.publicKeyBytes);

  const { data, error } = await supabase
    .from("nodes")
    .insert({
      public_key: auth.node.publicKey,
      claim_code: claimCode,
      name: payload.hostname || "WowLab Node",
      total_cores: payload.totalCores || 4,
      max_parallel: payload.enabledCores || payload.totalCores || 4,
      platform: payload.platform || "unknown",
      version: payload.version || null,
      status: "pending",
    })
    .select("id, claim_code")
    .single();

  if (error || !data) {
    return json({ error: error?.message || "Failed to create node" }, 400);
  }

  return json({ id: data.id, claimCode: data.claim_code, claimed: false });
});
