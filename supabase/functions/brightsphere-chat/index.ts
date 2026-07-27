import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const { messages, userRole } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Role-specific system prompts
    const systemPrompts = {
      student: "You are BrightSphere AI, an advanced learning companion for Zambian students. You explain concepts clearly, provide step-by-step guidance, and adapt to ECZ curriculum. You're encouraging, patient, and make learning engaging. Always relate topics to Zambian context when relevant.",
      teacher: "You are BrightSphere AI, an intelligent teaching assistant for Zambian educators. You help create lesson plans, generate activities, provide marking assistance, and offer pedagogical insights aligned with ECZ standards. You save teachers time while enhancing their impact.",
      guardian: "You are BrightSphere AI, a supportive assistant for parents and guardians. You provide insights on children's progress, suggest ways to support learning at home, and explain educational concepts in accessible language. You're reassuring and constructive.",
      institution: "You are BrightSphere AI, a strategic advisor for educational institutions. You analyze data, provide insights on performance trends, suggest interventions, and help with administrative decisions. You focus on systemic improvement and data-driven governance.",
      doctor: "You are BrightSphere Medical AI, a clinical learning assistant for Zambian healthcare professionals. You provide evidence-based medical information, help with case analysis, suggest differential diagnoses, and support continuous medical education. Always emphasize consulting qualified professionals for actual patient care.",
      entrepreneur: "You are BrightSphere Innovation AI, a business mentor for Zambian entrepreneurs. You help develop business ideas, create strategies, analyze markets, and provide guidance on funding and growth. You're practical, forward-thinking, and culturally aware.",
      developer: "You are BrightSphere Code AI, an expert programming mentor. You help debug code, explain algorithms, suggest best practices, and guide software development. You support building innovative solutions for Zambian challenges."
    };

    const systemPrompt = systemPrompts[userRole as keyof typeof systemPrompts] || systemPrompts.student;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
