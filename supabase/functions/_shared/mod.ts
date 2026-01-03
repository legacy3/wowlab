export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
};

export function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

export function textResponse(
  text: string,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(text, {
    status,
    headers: {
      "Content-Type": "text/plain",
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

export function optionsResponse(): Response {
  return new Response(null, { headers: corsHeaders });
}

// deno-lint-ignore no-explicit-any
type SupabaseClient = any; // TODO Find a way to import this type without issues

export async function validateAuth(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ user: { id: string } } | { error: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { error: jsonResponse({ error: "Unauthorized" }, 401) };
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { error: jsonResponse({ error: "Invalid token" }, 401) };
  }

  return { user };
}

export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

type HttpMethod = "GET" | "POST";

interface HandlerOptions {
  method: HttpMethod;
}

export function createHandler(
  options: HandlerOptions,
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    if (req.method === "OPTIONS") {
      return optionsResponse();
    }

    if (req.method !== options.method) {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    try {
      return await handler(req);
    } catch (err) {
      console.error("Unexpected error:", err);
      return jsonResponse({ error: String(err) }, 500);
    }
  };
}
