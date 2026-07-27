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
    const { content, outputType, subject, grade } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const outputInstructions: Record<string, string> = {
      notes: `Create comprehensive, well-structured study notes with:
- Clear headings and subheadings
- Key definitions highlighted in bold
- Important formulas or concepts in separate blocks
- Summary points at the end of each section
- Exam tips where relevant`,
      flashcards: `Generate 15-20 flashcards in this exact format for each card:
**Q:** [Question]
**A:** [Answer]

Make questions test key concepts, definitions, and applications.`,
      summary: `Create a concise executive summary covering:
- Main topics and themes
- Key takeaways (numbered list)
- Important terms and definitions
- Connections between concepts
- Suggested areas for deeper study`,
      quiz: `Generate a 15-question quiz with:
- Mix of multiple choice (10) and short answer (5)
- Answers provided at the end
- Difficulty progression from easy to hard
- Mark allocation for each question`,
      mindmap: `Create a text-based mind map outline showing:
- Central topic
- Main branches (3-5)
- Sub-branches for each (2-4 per branch)
- Key details on each sub-branch
Use indentation and bullet points to show hierarchy.`,
    };

    const systemPrompt = `You are an expert Zambian education content specialist. You analyze documents and educational materials to create high-quality study resources aligned with the ECZ curriculum. Always produce clear, well-formatted markdown output.`;

    const userPrompt = `Analyze the following content${subject ? ` (Subject: ${subject})` : ''}${grade ? ` (Grade: ${grade})` : ''} and ${outputInstructions[outputType] || outputInstructions.notes}

--- CONTENT START ---
${content.substring(0, 12000)}
--- CONTENT END ---`;

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
    console.error("ai-document-analyzer error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
