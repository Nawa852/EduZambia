// Unified streaming chat: supports multimodal (text + images), model picker,
// role-aware system prompts. Returns SSE in OpenAI format.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_MODELS = new Set([
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5-mini",
  "openai/gpt-5",
]);

const ROLE_PROMPTS: Record<string, string> = {
  student: "You are BrightSphere AI, a warm Zambian study companion. Use ECZ-aligned examples. Format answers in clean markdown with headings, bullets, tables, and LaTeX ($...$ or $$...$$) for math. Use fenced code blocks for code with language tags. Be step-by-step.",
  teacher: "You are BrightSphere AI for Zambian teachers. Help with lesson plans, rubrics, assessments, and ECZ alignment. Use markdown, tables, and LaTeX/code blocks as needed.",
  guardian: "You are BrightSphere AI for parents in Zambia. Be reassuring and practical. Use simple markdown.",
  entrepreneur: "You are BrightSphere AI for Zambian entrepreneurs. Practical, market-aware, Zambian context. Format in markdown with tables and bullets.",
  developer: "You are BrightSphere AI for developers. Give precise code in fenced blocks with language tags, plus concise explanations. Use markdown.",
  doctor: "You are BrightSphere Medical AI. Evidence-based, with citations where appropriate. Markdown formatted.",
  ministry: "You are BrightSphere AI for Zambian education policy makers. Data-driven, structured markdown.",
  default: "You are BrightSphere AI. Use clean markdown with headings, tables, LaTeX math, and fenced code blocks. Be helpful and accurate.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const body = await req.json();
    const messages = body.messages ?? [];
    const role = body.role || "default";
    const mode = body.mode || "chat"; // chat | snap-solve | deep-research | voice
    let model = body.model || "google/gemini-3-flash-preview";
    if (!ALLOWED_MODELS.has(model)) model = "google/gemini-3-flash-preview";

    let system = ROLE_PROMPTS[role] || ROLE_PROMPTS.default;
    if (mode === "snap-solve") {
      system += "\n\nThe user has uploaded a photo of a homework/exam problem. (1) Read every visible word and equation. (2) Restate the problem. (3) Solve step-by-step with LaTeX. (4) Give the final boxed answer. (5) Add a short 'Why this works' tip.";
    } else if (mode === "deep-research") {
      system += "\n\nGive a thorough, multi-source-style answer with sections: Summary, Key findings (bulleted), Counterpoints, Sources & further reading. Use markdown tables when comparing.";
    } else if (mode === "voice") {
      system += "\n\nThe user is talking to you with voice. Keep responses concise, friendly, and conversational (under 120 words unless asked for detail). Avoid heavy markdown.";
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("gateway error", upstream.status, t);
      const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 500;
      const msg = upstream.status === 429
        ? "Rate limit. Try again in a moment."
        : upstream.status === 402
        ? "AI credits exhausted. Add credits in workspace settings."
        : "AI gateway error";
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
