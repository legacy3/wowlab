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
