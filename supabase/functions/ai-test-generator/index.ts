// Generates a teacher test as structured JSON, with optional chart specs that
// the client renders as SVG (Recharts) inside the PDF. Returns:
// { title, instructions, sections: [{ heading, questions: [{ id, type, prompt, points, options?, answer?, chart? }] }] }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an expert Zambian ECZ teacher who writes high-quality assessments.
Output ONLY valid JSON matching this TypeScript type, no prose, no markdown fences:

type Test = {
  title: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  instructions: string;
  sections: Array<{
    heading: string;
    questions: Array<{
      id: string;
      type: "mcq" | "short" | "long" | "true_false";
      prompt: string; // may include LaTeX in $...$
      points: number;
      options?: string[]; // for mcq
      answer?: string; // model answer / key
      chart?: {
        kind: "bar" | "line" | "pie";
        title: string;
        // generic data rows with one "name" key + numeric series
        data: Array<Record<string, string | number>>;
        series: string[]; // numeric keys to plot
      };
    }>;
  }>;
};

Rules:
- Use Zambian/ECZ context examples where natural.
- Include 1-3 chart-based questions per test when the subject benefits (data handling, statistics, biology graphs, physics motion, business, economics).
- LaTeX must use single $...$ for inline and $$...$$ for blocks.
- For math/sciences include rigorous step-keys; for arts subjects give marking rubric in 'answer'.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const { subject, grade, topic, durationMinutes = 60, numQuestions = 15, level = "standard", includeCharts = true } = await req.json();
    if (!subject || !grade) {
      return new Response(JSON.stringify({ error: "subject and grade required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Generate an ECZ Grade ${grade} ${subject} test.
Topic focus: ${topic || "general syllabus"}
Difficulty: ${level}
Number of questions: ${numQuestions}
Duration: ${durationMinutes} minutes
Include chart questions: ${includeCharts ? "yes (1-3 charts as appropriate)" : "no"}
Return ONLY the JSON object.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("test-gen gateway error", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let test: any = {};
    try { test = JSON.parse(raw); } catch {
      // strip code fences if model added them
      const cleaned = raw.replace(/^```json\s*|\s*```$/g, "");
      test = JSON.parse(cleaned);
    }
    return new Response(JSON.stringify({ test }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
