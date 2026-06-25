import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  videoId: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/, 'Invalid videoId'),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().default(''),
});

// Minimal HTML escaper to avoid HTML injection in the generated document.
const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));

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
    const { videoId, title, description } = parsed.data;

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let transcript = '';
    if (youtubeApiKey) {
      try {
        const captionsUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${encodeURIComponent(videoId)}&key=${youtubeApiKey}`;
        const captionsResponse = await fetch(captionsUrl);
        const captionsData = await captionsResponse.json();
        if (captionsData.items && captionsData.items.length > 0) {
          transcript = description;
        }
      } catch (_e) {
        transcript = description;
      }
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content creator for Zambian students. Create comprehensive study notes that are:
            1. Well-structured with clear headings
            2. Include key concepts and definitions
            3. Provide examples relevant to Zambian context when possible
            4. Include practice questions
            5. Use simple, clear language appropriate for students
            6. Include study tips and memory aids`
          },
          {
            role: 'user',
            content: `Create detailed study notes for this educational video:

            Title: ${title}
            Description: ${description}
            Content: ${transcript}

            Format the notes as a structured document with:
            - Executive Summary
            - Key Concepts & Definitions
            - Main Topics (with bullet points)
            - Examples and Applications
            - Practice Questions (5-10 questions)
            - Study Tips
            - Additional Resources to Explore

            Make it comprehensive enough for a student to study from without watching the video.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!openaiResponse.ok) {
      console.error('OpenAI error:', openaiResponse.status);
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.', success: false }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    const studyNotes: string = openaiData.choices?.[0]?.message?.content ?? '';

    const safeTitle = escapeHtml(title);
    const safeDate = escapeHtml(new Date().toLocaleDateString());
    const safeVideoId = escapeHtml(videoId);
    const safeUserId = escapeHtml(user.id);

    const renderedBody = studyNotes.split('\n').map((raw) => {
      const line = escapeHtml(raw.trim());
      if (!line) return '';
      if (line.startsWith('# ')) return `<h2>${line.substring(2)}</h2>`;
      if (line.startsWith('## ')) return `<h3>${line.substring(3)}</h3>`;
      if (line.startsWith('- ') || line.startsWith('* ')) return `<li>${line.substring(2)}</li>`;
      if (line.match(/^\d+\./)) return `<li>${line.substring(line.indexOf('.') + 1).trim()}</li>`;
      return `<p>${line}</p>`;
    }).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Study Notes: ${safeTitle}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #4A90E2; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #4A90E2; margin-bottom: 10px; }
            .header .subtitle { color: #666; font-style: italic; }
            .section h2 { color: #2E5984; border-left: 4px solid #4A90E2; padding-left: 15px; }
            .section h3 { color: #4A90E2; }
            ul, ol { padding-left: 25px; }
            li { margin-bottom: 5px; }
            .footer { margin-top: 40px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #DDD; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Study Notes</h1>
            <h2>${safeTitle}</h2>
            <p class="subtitle">Generated by EduZambia AI Tutor</p>
            <p class="subtitle">Date: ${safeDate}</p>
        </div>
        <div class="content">${renderedBody}</div>
        <div class="footer">
            <p>Generated for User ID: ${safeUserId}</p>
            <p>EduZambia - Empowering Zambian Education with AI</p>
            <p>Video ID: ${safeVideoId}</p>
        </div>
    </body>
    </html>`;

    const pdfBuffer = new TextEncoder().encode(htmlContent);

    return new Response(JSON.stringify({
      pdfBuffer: Array.from(pdfBuffer),
      success: true,
      fileName: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.pdf`,
      contentType: 'text/html'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-pdf-notes function:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate notes. Please try again.',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
