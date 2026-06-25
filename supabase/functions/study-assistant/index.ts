import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  query: z.string().trim().min(1).max(2000),
  language: z.string().trim().max(32).optional().default('English'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { query, language } = parsed.data;

    const grokApiKey = Deno.env.get('GROCK_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');

    let response = '';
    let usedModel = '';

    const systemPrompt = `You are an AI Study Assistant for EduZambia, helping students with their academic questions.
    Provide clear, educational responses that are:
    - Appropriate for Zambian students
    - Aligned with ECZ (Examinations Council of Zambia) curriculum when relevant
    - Include step-by-step explanations for complex topics
    - Use culturally relevant examples when possible
    - Encourage learning and critical thinking

    If the student asks in a local language like Bemba or Nyanja, acknowledge their language but respond primarily in English with key terms explained.`;

    try {
      if (grokApiKey) {
        const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${grokApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: query }
            ],
            temperature: 0.7,
            max_tokens: 1000
          }),
        });
        if (grokResponse.ok) {
          const grokData = await grokResponse.json();
          response = grokData.choices[0]?.message?.content || '';
          usedModel = 'Grok';
        }
      }

      if (!response && openaiApiKey) {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: query }
            ],
            temperature: 0.7,
            max_tokens: 1000
          }),
        });
        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          response = openaiData.choices[0]?.message?.content || '';
          usedModel = 'GPT-4o-mini';
        }
      }

      if (!response && claudeApiKey) {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${claudeApiKey}`, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{ role: 'user', content: `${systemPrompt}\n\nStudent question: ${query}` }]
          }),
        });
        if (claudeResponse.ok) {
          const claudeData = await claudeResponse.json();
          response = claudeData.content[0]?.text || '';
          usedModel = 'Claude';
        }
      }

      if (!response) {
        response = "I'm sorry, I'm having trouble connecting to my AI models right now. Please try again in a moment, or contact support if the problem persists.";
        usedModel = 'Fallback';
      }

      // Always use authenticated user.id (never client-supplied) for logs/analytics.
      await supabaseClient
        .from('study_assistant_logs')
        .insert([{
          user_id: user.id,
          query,
          response: { text: response, model: usedModel },
          language
        }]);

      await supabaseClient
        .from('learning_analytics')
        .insert([{
          user_id: user.id,
          activity_type: 'ai_study_assistance',
          content_id: `query_${Date.now()}`,
          metadata: {
            query_length: query.length,
            response_length: response.length,
            language,
            model_used: usedModel
          }
        }]);

      return new Response(JSON.stringify({
        response,
        model: usedModel,
        language,
        success: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (apiError) {
      console.error('AI API error:', apiError);
      const fallbackResponse = `I apologize, but I'm experiencing technical difficulties right now.

Here are some general study tips while I get back online:
- Break complex problems into smaller steps
- Practice regularly rather than cramming
- Ask specific questions about what you don't understand
- Use multiple resources to reinforce learning

Please try asking your question again in a few minutes.`;
      return new Response(JSON.stringify({
        response: fallbackResponse,
        model: 'Fallback',
        success: false,
        error: 'AI service temporarily unavailable'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('Error in study-assistant function:', error);
    return new Response(JSON.stringify({
      error: 'Service temporarily unavailable. Please try again.',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
