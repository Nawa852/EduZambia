import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subject, grade, topic, duration } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert Zambian teacher and curriculum designer. You create detailed, ECZ-aligned (Examinations Council of Zambia) lesson plans.

Always structure your response with these sections:
1. **Lesson Title**
2. **Learning Objectives** (3-5 measurable objectives aligned to ECZ syllabus)
3. **Prerequisites** (what students should already know)
4. **Starter Activity** (5-10 min warm-up/engagement)
5. **Main Teaching Content** (detailed explanation with examples)
6. **Student Activities** (individual and group work)
7. **Assessment Questions** (5-10 questions of varying difficulty)
8. **Homework Assignment** (take-home practice)
9. **Resources Needed** (materials, textbooks, etc.)
10. **Differentiation** (how to support struggling and advanced learners)

Use clear, simple English appropriate for Zambian secondary school context. Reference local examples where possible.`;

    const userPrompt = `Create a complete lesson plan for:
- Subject: ${subject || 'Mathematics'}
- Grade: ${grade || 'Grade 10'}
- Topic: ${topic || 'General topic'}
- Duration: ${duration || '40 minutes'}

Make it practical, engaging, and fully aligned with the ECZ curriculum.`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await response.json();
    const lessonPlan = json?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ lessonPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-lesson-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
