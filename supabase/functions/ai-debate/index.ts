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

    const { topic, subject, stance, history, difficulty } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = `You are a Socratic debate partner for Zambian students. Your role is to sharpen their critical thinking through rigorous academic debate.

RULES:
- Challenge every claim with evidence-based counter-arguments
- Ask probing questions that expose logical gaps
- Never be rude, but be intellectually relentless
- Use real-world examples relevant to Zambia and Africa
- Difficulty: ${difficulty || 'medium'} (easy=supportive, medium=challenging, hard=merciless)
- Score the student's argument quality after each exchange
- Point out logical fallacies by name (ad hominem, straw man, etc.)

TOPIC: ${topic}
SUBJECT: ${subject || 'General'}
STUDENT'S STANCE: ${stance || 'Not specified'}

After responding, include a JSON block at the end:
<!--SCORE-->{"argument_score": 65, "logic_score": 70, "evidence_score": 60, "fallacies_detected": ["straw man"], "tip": "One actionable improvement tip"}<!--/SCORE-->`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
    ];

    if (history?.length === 0 || !history) {
      messages.push({ role: 'user', content: `I want to debate: "${topic}". My stance: ${stance || 'I believe this is important'}. Challenge me!` });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit reached.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract score from response
    let scores = null;
    const scoreMatch = content.match(/<!--SCORE-->([\s\S]*?)<!--\/SCORE-->/);
    if (scoreMatch) {
      try { scores = JSON.parse(scoreMatch[1]); } catch {}
    }

    const debateResponse = content.replace(/<!--SCORE-->[\s\S]*?<!--\/SCORE-->/, '').trim();

    return new Response(JSON.stringify({
      response: debateResponse,
      scores,
      success: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Debate partner error:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
