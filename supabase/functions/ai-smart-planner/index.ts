import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });


  const authResult = await requireUser(req);
  if (authResult instanceof Response) return authResult;
  const authedUserId = authResult.id;
  try {
    const { subjects, examDate, weakAreas, availableHours, grade, preferences } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert AI study planner for Zambian students preparing for ECZ exams. Create detailed, realistic, and motivating study plans that maximize learning efficiency.

Your plans should:
- Prioritize weak areas while maintaining strong subjects
- Include specific study techniques (active recall, spaced repetition, practice papers)
- Build in breaks using the Pomodoro technique
- Include revision and self-testing sessions
- Be realistic and not overloaded
- Use encouraging, motivational language`;

    const userPrompt = `Create a personalized weekly study plan:

**Student Details:**
- Grade: ${grade || 'Grade 12'}
- Subjects: ${subjects?.join(', ') || 'Mathematics, Science, English'}
- Exam Date: ${examDate || 'In 3 months'}
- Weak Areas: ${weakAreas?.join(', ') || 'Not specified'}
- Available Study Hours Per Day: ${availableHours || 4}
${preferences ? `- Preferences: ${preferences}` : ''}

Generate a **7-day study timetable** in a clean markdown table format with:
1. Time slots for each day (Morning, Afternoon, Evening)
2. Specific topics to cover in each slot
3. Study technique recommendations for each session
4. Daily goals and checkpoints
5. Weekend review/practice paper sessions

Also include:
- **Weekly Goals** (5 specific, measurable goals)
- **Study Tips** tailored to the student's weak areas
- **Motivation Quote** to start the week`;

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
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-smart-planner error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
