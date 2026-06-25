import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const isRateLimited = (userId: string): boolean => {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 });
    return false;
  }
  if (userLimit.count >= 30) return true;
  userLimit.count++;
  return false;
};

const MODELS: Record<string, string> = {
  'gemini-flash': 'google/gemini-2.5-flash',
  'gemini-pro': 'google/gemini-2.5-pro',
  'gpt5-mini': 'openai/gpt-5-mini',
  'gpt5': 'openai/gpt-5',
  'gemini-flash-lite': 'google/gemini-2.5-flash-lite',
  'gemini-3-flash': 'google/gemini-3-flash-preview',
};

const MessageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  model: z.enum(Object.keys(MODELS) as [string, ...string[]]).optional(),
  systemPrompt: z.string().max(4000).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['system','user','assistant']),
    content: z.string().max(4000),
  })).max(20).optional(),
  subject: z.string().max(64).optional(),
  gradeLevel: z.string().max(32).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (isRateLimited(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const parsed = MessageSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { message, model, systemPrompt, conversationHistory, subject, gradeLevel } = parsed.data;

    const selectedModel = MODELS[model ?? 'gemini-flash'];

    const defaultSystem = `You are BrightSphere AI — a world-class educational tutor for Zambian students.

CORE CAPABILITIES:
- Explain complex concepts in simple, relatable terms with real-world Zambian examples
- Solve mathematics & science problems step-by-step with clear working
- Help prepare for ECZ examinations (Grade 7, 9, 12) with exam-style practice
- Create study plans, mnemonics, and revision strategies
- Support all ECZ subjects: Mathematics, Science, English, Social Studies, Biology, Chemistry, Physics, etc.

PERSONALITY:
- Encouraging and patient — celebrate effort, not just correctness
- Use clear markdown formatting with headers, bullet points, and code blocks
- When solving math, show EVERY step with explanations
- Provide exam tips and common mistake warnings
- Reference the Zambian curriculum and ECZ marking schemes

${subject ? `Current subject focus: ${subject}` : ''}
${gradeLevel ? `Student grade level: ${gradeLevel}` : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt || defaultSystem },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI rate limit reached. Try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'I could not generate a response. Please try again.';

    return new Response(
      JSON.stringify({
        response: content,
        model: selectedModel,
        usage: data.usage || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in multi-ai-tutor:', error)
    return new Response(
      JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
