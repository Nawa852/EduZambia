import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('AI service not configured');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gather user learning data in parallel
    const [enrollments, completions, quizzes, goals, focusSessions, profile] = await Promise.all([
      supabaseClient.from('enrollments').select('course_id, progress, enrolled_at').eq('user_id', user.id).limit(20),
      supabaseClient.from('lesson_completions').select('lesson_id, course_id, completed_at').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(30),
      supabaseClient.from('quiz_attempts').select('subject, correct_answers, total_questions, grade_level, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabaseClient.from('study_goals').select('title, current, target, completed, goal_type').eq('user_id', user.id).limit(10),
      supabaseClient.from('focus_sessions').select('subject, focus_minutes, sessions_completed, gave_up, started_at').eq('user_id', user.id).order('started_at', { ascending: false }).limit(20),
      supabaseClient.from('profiles').select('grade, role').eq('id', user.id).single(),
    ]);

    const quizPerformance = (quizzes.data || []).map(q => ({
      subject: q.subject,
      score: q.total_questions > 0 ? Math.round((q.correct_answers / q.total_questions) * 100) : 0,
      grade: q.grade_level,
      date: q.created_at,
    }));

    const studyHabits = (focusSessions.data || []).map(s => ({
      subject: s.subject,
      minutes: s.focus_minutes,
      completed: !s.gave_up,
    }));

    const prompt = `Analyze this Zambian student's learning data and provide personalized recommendations:

STUDENT PROFILE:
- Grade: ${profile.data?.grade || 'Unknown'}
- Role: ${profile.data?.role || 'student'}
- Active enrollments: ${enrollments.data?.length || 0}
- Lessons completed: ${completions.data?.length || 0}

QUIZ PERFORMANCE (recent):
${JSON.stringify(quizPerformance.slice(0, 10))}

STUDY HABITS:
${JSON.stringify(studyHabits.slice(0, 10))}

ACTIVE GOALS:
${JSON.stringify((goals.data || []).filter(g => !g.completed))}

Provide a JSON response with:
{
  "recommendations": [
    {
      "type": "subject_focus|study_habit|exam_prep|goal",
      "title": "Short title",
      "description": "Actionable advice in 1-2 sentences",
      "priority": "high|medium|low",
      "icon": "📚|🧮|🔬|📝|⏰|🎯|💪|🌟"
    }
  ],
  "insights": {
    "strengths": ["Area 1", "Area 2"],
    "improvement_areas": ["Area 1", "Area 2"],
    "study_streak_tip": "One sentence motivation",
    "weekly_focus": "What to prioritize this week"
  },
  "suggested_subjects": ["Subject 1", "Subject 2"]
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
          { role: 'system', content: 'You are an AI learning analyst for Zambian students. Provide helpful, specific, actionable recommendations. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let recommendations;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      recommendations = null;
    }

    if (!recommendations) {
      recommendations = {
        recommendations: [
          { type: 'study_habit', title: 'Keep Learning Daily', description: 'Try to complete at least one lesson each day to build momentum.', priority: 'high', icon: '📚' },
          { type: 'exam_prep', title: 'Practice Past Papers', description: 'Work through ECZ past papers to familiarize yourself with exam format.', priority: 'medium', icon: '📝' },
        ],
        insights: {
          strengths: ['Active learning'],
          improvement_areas: ['Consistency'],
          study_streak_tip: 'Every lesson counts — keep going!',
          weekly_focus: 'Focus on your weakest subject for 30 minutes daily.',
        },
        suggested_subjects: ['Mathematics', 'Science'],
      };
    }

    return new Response(JSON.stringify({ ...recommendations, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please try again.', success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});