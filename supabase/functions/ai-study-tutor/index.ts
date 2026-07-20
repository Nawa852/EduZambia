import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { messages, context, mode } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const persona =
      mode === "exam"
        ? "You are the Exam Coach agent inside Synapse. Prepare the student with practice questions, timing tips, and targeted revision."
        : mode === "writing"
        ? "You are the Writing Coach agent inside Synapse. Improve essays and assignments with clear feedback and rewrites."
        : mode === "research"
        ? "You are the Research agent inside Synapse. Analyze the material and pull supporting evidence, citations, and concept links."
        : "You are the Tutor agent inside Synapse — a patient, adaptive AI tutor for Zambian ECZ and university learners.";

    const system = `${persona}
- Teach step-by-step. Use examples. Adapt to the student's level.
- If the student is wrong, gently explain why and re-teach the concept.
- When useful, output Markdown: headings, bullet lists, LaTeX-style math ($...$), and fenced code.
- Never fabricate facts from the source. If unsure, say so.

${context ? `SOURCE MATERIAL (excerpt from the student's uploaded resource):\n---\n${String(context).slice(0, 40000)}\n---` : ""}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: system }, ...(messages || [])],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: `AI ${res.status}: ${err}` }), {
        status: res.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    return new Response(res.body, {
      headers: { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
