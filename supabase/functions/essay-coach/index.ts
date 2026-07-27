import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })


  const authResult = await requireUser(req);
  if (authResult instanceof Response) return authResult;
  const authedUserId = authResult.id;
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('AI not configured');

    const { essay, subject, assignment_type, grade_level, word_limit } = await req.json();

    if (!essay || essay.trim().length < 50) {
      return new Response(JSON.stringify({ error: 'Essay must be at least 50 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const prompt = `You are an expert academic writing coach for Zambian students. Analyze this essay thoroughly and provide detailed, actionable feedback.

ASSIGNMENT TYPE: ${assignment_type || 'Essay'}
SUBJECT: ${subject || 'General'}
GRADE LEVEL: ${grade_level || 'Grade 12'}
WORD LIMIT: ${word_limit || 'Not specified'}
WORD COUNT: ${essay.split(/\s+/).length}

ESSAY:
"""
${essay}
"""

Provide comprehensive feedback as JSON:
{
  "overall_score": 72,
  "scores": {
    "content": { "score": 75, "max": 100, "feedback": "..." },
    "structure": { "score": 70, "max": 100, "feedback": "..." },
    "grammar": { "score": 65, "max": 100, "feedback": "..." },
    "vocabulary": { "score": 80, "max": 100, "feedback": "..." },
    "argumentation": { "score": 70, "max": 100, "feedback": "..." },
    "originality": { "score": 75, "max": 100, "feedback": "..." }
  },
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": [
    { "issue": "Issue description", "location": "Paragraph 2", "suggestion": "How to fix it", "priority": "high" }
  ],
  "grammar_fixes": [
    { "original": "wrong text", "corrected": "correct text", "rule": "Grammar rule" }
  ],
  "enhanced_version": "A rewritten version of the first paragraph showing improvements",
  "vocabulary_upgrades": [
    { "basic": "good", "advanced": "exemplary", "context": "Use in academic writing" }
  ],
  "ecz_tips": "Specific ECZ marking scheme advice",
  "grade_prediction": "B+",
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}

Return ONLY valid JSON.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a world-class academic writing coach. Provide detailed, encouraging, and actionable feedback. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit reached.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch { result = null; }

    return new Response(JSON.stringify({ ...(result || { error: 'Could not analyze essay' }), success: !!result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Essay coach error:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
