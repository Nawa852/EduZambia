import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Fixed allowlist. Callers may only ask about these provider names — they can
 * never supply an arbitrary environment-variable name to probe.
 */
const PROVIDERS: Record<string, string> = {
  "GPT-4o": "OPENAI_API_KEY",
  Whisper: "OPENAI_API_KEY",
  "Claude 3": "ANTHROPIC_API_KEY",
  Gemini: "GEMINI_API_KEY",
  DeepSeek: "DEEPSEEK_API_KEY",
  "Lovable AI": "LOVABLE_API_KEY",
};

async function requireUser(req: Request): Promise<Response | { id: string }> {
  const unauthorized = () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return unauthorized();

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await sb.auth.getClaims(authHeader.replace("Bearer ", ""));
  const sub = data?.claims?.sub;
  if (error || !sub) return unauthorized();
  return { id: sub as string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireUser(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json().catch(() => ({}));
    const requested: string[] = Array.isArray(body?.apis)
      ? body.apis.map((a: unknown) =>
          typeof a === "string" ? a : String((a as { name?: unknown })?.name ?? ""),
        )
      : [];

    // Anything outside the allowlist is silently dropped.
    const names = requested.filter((n) => Object.prototype.hasOwnProperty.call(PROVIDERS, n));
    const results: Record<string, boolean> = {};

    for (const name of names) {
      const apiKey = Deno.env.get(PROVIDERS[name]);
      if (!apiKey) {
        results[name] = false;
        continue;
      }

      try {
        switch (name) {
          case "GPT-4o":
          case "Whisper": {
            const res = await fetch("https://api.openai.com/v1/models", {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            results[name] = res.ok;
            break;
          }
          case "Claude 3": {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
              },
              body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                max_tokens: 10,
                messages: [{ role: "user", content: "Hi" }],
              }),
            });
            results[name] = res.status !== 401 && res.status !== 403;
            break;
          }
          case "Gemini": {
            const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
              headers: { "x-goog-api-key": apiKey },
            });
            results[name] = res.ok;
            break;
          }
          case "DeepSeek": {
            const res = await fetch("https://api.deepseek.com/v1/models", {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            results[name] = res.ok;
            break;
          }
          default:
            results[name] = true;
            break;
        }
      } catch (_e) {
        results[name] = false;
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Failed to check API status" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
