import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  topic: z.string().trim().min(1).max(200),
  gradeLevel: z.string().trim().min(1).max(32),
  subject: z.string().trim().min(1).max(64),
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
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { topic, gradeLevel, subject } = parsed.data;

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

    if (!openaiApiKey || !youtubeApiKey) {
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are an educational curriculum designer for Zambian students. Create structured learning paths.` },
          {
            role: 'user',
            content: `Create a learning path for "${topic}" suitable for ${gradeLevel} in ${subject}.

            Provide 8-12 specific video topics in sequence. Format as JSON array:
            [
              { "title": "Topic Title", "description": "Brief description", "keywords": "search keywords", "difficulty": "beginner/intermediate/advanced" }
            ]`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!openaiResponse.ok) {
      console.error('OpenAI error', openaiResponse.status);
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable', videos: [] }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const openaiData = await openaiResponse.json();
    let learningTopics: Array<{ title: string; description: string; keywords: string; difficulty: string }>;

    try {
      learningTopics = JSON.parse(openaiData.choices[0].message.content);
    } catch (_parseError) {
      learningTopics = [
        { title: `Introduction to ${topic}`, description: `Basic concepts of ${topic}`, keywords: `${topic} introduction basics`, difficulty: 'beginner' },
        { title: `${topic} Fundamentals`,    description: `Core principles`,            keywords: `${topic} fundamentals`,            difficulty: 'intermediate' }
      ];
    }

    const videos: unknown[] = [];

    for (const learningTopic of learningTopics) {
      const searchQuery = `${learningTopic.keywords} ${gradeLevel} educational tutorial`;
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoDuration=medium&order=relevance&safeSearch=strict&maxResults=3&key=${youtubeApiKey}`;
      try {
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        if (searchData.items && searchData.items.length > 0) {
          const bestVideo = searchData.items[0];
          const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${encodeURIComponent(bestVideo.id.videoId)}&key=${youtubeApiKey}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          if (detailsData.items && detailsData.items.length > 0) {
            const videoDetails = detailsData.items[0];
            const duration = videoDetails.contentDetails.duration as string;
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)!;
            const hours = match[1] ? parseInt(match[1]) : 0;
            const minutes = match[2] ? parseInt(match[2]) : 0;
            const seconds = match[3] ? parseInt(match[3]) : 0;
            let formattedDuration = '';
            if (hours > 0) formattedDuration += `${hours}:`;
            formattedDuration += `${minutes.toString().padStart(hours > 0 ? 2 : 1, '0')}:`;
            formattedDuration += seconds.toString().padStart(2, '0');
            videos.push({
              id: videoDetails.id,
              title: videoDetails.snippet.title,
              description: videoDetails.snippet.description,
              thumbnail: videoDetails.snippet.thumbnails.medium.url,
              duration: formattedDuration,
              viewCount: videoDetails.statistics.viewCount || '0',
              likeCount: videoDetails.statistics.likeCount || '0',
              channelTitle: videoDetails.snippet.channelTitle,
              publishedAt: videoDetails.snippet.publishedAt,
              learningTopic: learningTopic.title,
              difficulty: learningTopic.difficulty
            });
          }
        }
      } catch (videoError) {
        console.error('YouTube fetch error', videoError);
      }
    }

    return new Response(JSON.stringify({
      videos,
      learningTopics,
      pathMetadata: { topic, gradeLevel, subject, totalVideos: videos.length, estimatedHours: Math.ceil(videos.length * 0.5) }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in generate-learning-path function:', error);
    return new Response(JSON.stringify({
      error: 'Service temporarily unavailable. Please try again.',
      videos: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
