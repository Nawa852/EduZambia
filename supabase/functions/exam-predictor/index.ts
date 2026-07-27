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

    const { subject, grade_level, topics, exam_type } = await req.json();

    if (!subject) {
      return new Response(JSON.stringify({ error: 'Subject is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const prompt = `You are an expert ECZ (Examinations Council of Zambia) exam analyst. Based on historical exam patterns, predict the most likely questions for the upcoming ${exam_type || 'final'} exam.

SUBJECT: ${subject}
GRADE LEVEL: ${grade_level || 'Grade 12'}
FOCUS TOPICS: ${JSON.stringify(topics || [])}

Generate a comprehensive exam prediction with:
1. 8-10 predicted questions ranked by probability (high/medium/low)
2. For each question, provide:
   - The predicted question text
   - Topic/chapter it covers
   - Probability level (high/medium/low)
   - Key concepts to master
   - A brief model answer outline
3. Exam strategy tips specific to this subject
4. Common mistakes students make
5. Time allocation advice per section

Return ONLY valid JSON:
{
  "predictions": [
    {
      "question": "Full question text",
      "topic": "Topic name",
      "probability": "high|medium|low",
      "marks": 10,
      "key_concepts": ["concept1", "concept2"],
      "answer_outline": "Brief model answer structure",
      "difficulty": "easy|medium|hard"
    }
  ],
  "strategy": {
    "time_tips": "Time management advice",
    "common_mistakes": ["mistake1", "mistake2"],
    "power_topics": ["Most important topics to revise"],
    "exam_hacks": ["Strategic tips for maximum marks"]
  },
  "confidence_score": 78,
  "revision_priority": ["Topic in order of importance"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert exam prediction AI specializing in Zambian ECZ examinations. Analyze patterns and predict likely questions with high accuracy. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit reached. Try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Credits exhausted. Please top up.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch { result = null; }

    if (!result) {
      result = {
        predictions: [{ question: 'Could not generate predictions. Try again.', topic: subject, probability: 'medium', marks: 10, key_concepts: [], answer_outline: '', difficulty: 'medium' }],
        strategy: { time_tips: 'Allocate time proportionally to marks.', common_mistakes: [], power_topics: [], exam_hacks: [] },
        confidence_score: 0,
        revision_priority: [],
      };
    }

    return new Response(JSON.stringify({ ...result, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Exam predictor error:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
