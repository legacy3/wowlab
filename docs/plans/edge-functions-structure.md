# Edge Functions Structure Plan

## Requirements
- Per-function `deno.json` with import map
- Shared code in `_shared/` with relative imports

## Code Style
- NO JSDoc comments
- NO inline comments explaining obvious code
- NO backwards compatibility shims
- NO re-exports of standard library functions
- All control flow statements MUST have brackets

## Structure

```
supabase/functions/
├── _shared/
│   ├── cors.ts
│   ├── response.ts
│   ├── supabase.ts
│   ├── auth.ts
│   └── ed25519.ts
├── node-register/
│   ├── index.ts
│   └── deno.json
├── node-heartbeat/
│   ├── index.ts
│   └── deno.json
├── chunk-claim/
│   ├── index.ts
│   └── deno.json
├── chunk-complete/
│   ├── index.ts
│   └── deno.json
├── config-fetch/
│   ├── index.ts
│   └── deno.json
├── config-upsert/
│   ├── index.ts
│   └── deno.json
├── job-create/
│   ├── index.ts
│   └── deno.json
├── rotation-fetch/
│   ├── index.ts
│   └── deno.json
├── icons/
│   ├── index.ts
│   └── deno.json
└── talent-atlas/
    ├── index.ts
    └── deno.json
```

## deno.json Templates

### Functions needing Ed25519 (node-register, node-heartbeat, chunk-claim, chunk-complete)

```json
{
  "imports": {
    "@supabase/functions-js/edge-runtime.d.ts": "jsr:@supabase/functions-js/edge-runtime.d.ts",
    "@supabase/supabase-js": "npm:@supabase/supabase-js@2",
    "@std/encoding": "jsr:@std/encoding@1",
    "@noble/ed25519": "npm:@noble/ed25519@2"
  }
}
```

### Functions needing only Supabase (config-fetch, config-upsert, job-create, rotation-fetch)

```json
{
  "imports": {
    "@supabase/functions-js/edge-runtime.d.ts": "jsr:@supabase/functions-js/edge-runtime.d.ts",
    "@supabase/supabase-js": "npm:@supabase/supabase-js@2",
    "@std/encoding": "jsr:@std/encoding@1"
  }
}
```

### Functions needing nothing (icons, talent-atlas)

```json
{
  "imports": {
    "@supabase/functions-js/edge-runtime.d.ts": "jsr:@supabase/functions-js/edge-runtime.d.ts"
  }
}
```

## _shared/ Modules

### cors.ts
```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-node-key, x-node-sig, x-node-ts",
};
```

### response.ts
```typescript
import { corsHeaders } from "./cors.ts";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export function text(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain", ...corsHeaders },
  });
}

export function options(): Response {
  return new Response(null, { headers: corsHeaders });
}
```

### supabase.ts
```typescript
import { createClient } from "@supabase/supabase-js";

export function createAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
```

### auth.ts
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import { json } from "./response.ts";

type AuthResult = { error: Response } | { user: { id: string } };

export async function validateUser(
  req: Request,
  supabase: SupabaseClient,
): Promise<AuthResult> {
  const header = req.headers.get("Authorization");
  if (!header) {
    return { error: json({ error: "Unauthorized" }, 401) };
  }
  const token = header.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: json({ error: "Invalid token" }, 401) };
  }
  return { user: { id: data.user.id } };
}
```

### ed25519.ts
```typescript
import { verify } from "@noble/ed25519";
import { decodeBase64, encodeHex, encodeBase32 } from "@std/encoding";
import { json } from "./response.ts";

type VerifyResult =
  | { error: Response }
  | { node: { publicKey: string; publicKeyBytes: Uint8Array } };

export async function verifyNode(req: Request, body: string): Promise<VerifyResult> {
  const pubkey = req.headers.get("X-Node-Key");
  const sig = req.headers.get("X-Node-Sig");
  const ts = req.headers.get("X-Node-Ts");

  if (!pubkey || !sig || !ts) {
    return { error: json({ error: "Missing auth headers" }, 401) };
  }

  const timestamp = parseInt(ts, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return { error: json({ error: "Timestamp expired" }, 401) };
  }

  const pubkeyBytes = decodeBase64(pubkey);
  const sigBytes = decodeBase64(sig);

  if (pubkeyBytes.length !== 32 || sigBytes.length !== 64) {
    return { error: json({ error: "Invalid key/sig length" }, 401) };
  }

  const bodyBytes = new TextEncoder().encode(body);
  const bodyHash = encodeHex(await crypto.subtle.digest("SHA-256", bodyBytes));

  const message = `${ts}\0${req.method}\0${new URL(req.url).pathname}\0${bodyHash}`;
  const messageBytes = new TextEncoder().encode(message);

  const valid = await verify(sigBytes, messageBytes, pubkeyBytes);
  if (!valid) {
    return { error: json({ error: "Invalid signature" }, 401) };
  }

  return { node: { publicKey: pubkey, publicKeyBytes: pubkeyBytes } };
}

export async function deriveClaimCode(pubkeyBytes: Uint8Array): Promise<string> {
  const hash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", pubkeyBytes.buffer as ArrayBuffer),
  );
  return encodeBase32(hash.slice(0, 4)).replace(/=+$/, "").slice(0, 6).toUpperCase();
}
```

## Function Import Pattern

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { options, json } from "../_shared/response.ts";
import { createAdmin } from "../_shared/supabase.ts";
import { verifyNode } from "../_shared/ed25519.ts";

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

  // auth.node.publicKey - base64 pubkey
  // auth.node.publicKeyBytes - Uint8Array
});
```
