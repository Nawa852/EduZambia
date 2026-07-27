import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


/**
 * Auth guard. Every caller must present a real end-user JWT; anonymous
 * requests are rejected so nobody can burn platform AI credits for free.
 */
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
  // An anon/publishable key is also a JWT but carries no `sub`, so it fails here.
  if (error || !sub) return unauthorized();
  return { id: sub as string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });


  const authResult = await requireUser(req);
  if (authResult instanceof Response) return authResult;
  const authedUserId = authResult.id;
  try {
    const { messages, subject, grade } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are BrightSphere Voice Tutor — a warm, encouraging AI study companion for Zambian students. You speak naturally like a friendly tutor sitting next to the student.

RULES:
- Keep responses concise (2-4 sentences max) since they will be read aloud
- Use simple, clear language appropriate for ${grade || 'secondary school'} level
- Focus on ${subject || 'the subject'} when specified
- Break complex concepts into bite-sized explanations
- Ask follow-up questions to check understanding
- Use Zambian examples and context when possible (ECZ curriculum)
- Be encouraging: celebrate correct answers, gently correct mistakes
- If the student seems stuck, give hints before full answers
- End responses with a brief question or prompt to keep the conversation going`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("voice-tutor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
