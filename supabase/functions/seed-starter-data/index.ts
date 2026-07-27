import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type Client = ReturnType<typeof createClient>;

const STUDENT_COURSES = [
  { name: 'Mathematics', subject: 'Mathematics', emoji: '📐', color: '#2563eb', grade: 'Grade 12', daily_minutes: 45 },
  { name: 'Biology', subject: 'Biology', emoji: '🧬', color: '#16a34a', grade: 'Grade 12', daily_minutes: 30 },
  { name: 'English Language', subject: 'English', emoji: '📖', color: '#9333ea', grade: 'Grade 12', daily_minutes: 30 },
];

const RESOURCE_TEMPLATES: Record<string, { title: string; summary: string }[]> = {
  Mathematics: [
    { title: 'Quadratic Equations — Starter Notes', summary: 'Factorising, completing the square and the quadratic formula, with ECZ-style worked examples.' },
    { title: 'Trigonometry Quick Reference', summary: 'SOHCAHTOA, the sine and cosine rules, and common exam traps.' },
  ],
  Biology: [
    { title: 'Cell Structure & Function', summary: 'Organelles, plant vs animal cells, and transport across membranes.' },
  ],
  English: [
    { title: 'Essay Structure Guide', summary: 'Introduction, body paragraphs (PEEL) and conclusions for ECZ compositions.' },
  ],
};

async function seedStudent(supabase: Client, userId: string) {
  const { count } = await supabase
    .from('study_courses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if ((count ?? 0) > 0) return { skipped: true };

  const { data: courses } = await supabase
    .from('study_courses')
    .insert(STUDENT_COURSES.map((c) => ({ ...c, user_id: userId, level: 'secondary', board: 'ECZ' })))
    .select('id, subject');

  for (const course of courses ?? []) {
    const templates = RESOURCE_TEMPLATES[(course as { subject: string }).subject] ?? [];
    if (!templates.length) continue;
    await supabase.from('study_resources').insert(
      templates.map((t) => ({
        user_id: userId,
        course_id: (course as { id: string }).id,
        title: t.title,
        kind: 'note',
        summary: t.summary,
        extracted_text: t.summary,
      })),
    );
  }

  await supabase.from('study_goals').insert([
    { user_id: userId, title: 'Study 30 minutes today', goal_type: 'daily_minutes', target: 30, current: 0 },
    { user_id: userId, title: 'Complete 3 lessons this week', goal_type: 'lessons', target: 3, current: 0 },
    { user_id: userId, title: 'Pass 2 practice quizzes', goal_type: 'quizzes', target: 2, current: 0 },
  ]);

  await supabase.from('user_stats').upsert({ user_id: userId }, { onConflict: 'user_id' });

  // A public starter study group the learner is already part of.
  const { data: group } = await supabase
    .from('study_groups')
    .insert({
      name: 'Grade 12 Exam Crew',
      subject: 'Mathematics',
      grade_level: 'Grade 12',
      description: 'Daily revision sprints and past-paper walkthroughs.',
      is_public: true,
      created_by: userId,
      max_members: 40,
    })
    .select('id')
    .single();
  if (group) {
    await supabase.from('study_group_members').insert({ group_id: (group as { id: string }).id, user_id: userId });
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'welcome',
    title: 'Your study space is ready',
    message: 'We set up three subjects, starter notes and your first goals. Open the Study Hub to begin.',
    link: '/study',
  });

  return { skipped: false };
}

async function seedTeacher(supabase: Client, userId: string) {
  const { count } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId);
  if ((count ?? 0) > 0) return { skipped: true };

  const { data: course } = await supabase
    .from('courses')
    .insert({
      title: 'Mathematics — Grade 12 ECZ Revision',
      description: 'A starter course covering algebra, trigonometry and statistics with ECZ-aligned assessments.',
      subject: 'Mathematics',
      grade_level: 'Grade 12',
      created_by: userId,
      is_published: true,
    })
    .select('id')
    .single();

  const courseId = (course as { id: string } | null)?.id;
  if (courseId) {
    await supabase.from('lessons').insert([
      { course_id: courseId, title: 'Algebraic Manipulation', order_index: 1, duration_minutes: 40, content: 'Expanding, factorising and simplifying expressions.' },
      { course_id: courseId, title: 'Quadratic Equations', order_index: 2, duration_minutes: 45, content: 'Solving by factorising, formula and graphing.' },
      { course_id: courseId, title: 'Trigonometry Basics', order_index: 3, duration_minutes: 40, content: 'Ratios, the sine rule and the cosine rule.' },
    ]);
    await supabase.from('assignments').insert({
      course_id: courseId,
      title: 'Algebra Practice Set 1',
      description: 'Ten questions on factorising and solving quadratics.',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      max_score: 20,
      created_by: userId,
    });
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'welcome',
    title: 'Your teaching space is ready',
    message: 'A starter course with three lessons and one assignment is waiting for you.',
    link: '/teacher-dashboard',
  });

  return { skipped: false };
}

async function seedGuardian(supabase: Client, userId: string) {
  const { count } = await supabase
    .from('guardian_links')
    .select('id', { count: 'exact', head: true })
    .eq('guardian_id', userId);
  if ((count ?? 0) > 0) return { skipped: true };

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'welcome',
    title: 'Link your learner',
    message: 'Add your child to start receiving weekly progress digests and attendance alerts.',
    link: '/parent-dashboard',
  });
  return { skipped: false };
}

async function seedGeneric(supabase: Client, userId: string, role: string) {
  await supabase.from('user_stats').upsert({ user_id: userId }, { onConflict: 'user_id' });
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'welcome');
  if ((count ?? 0) > 0) return { skipped: true };
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'welcome',
    title: 'Welcome to Synapse',
    message: `Your ${role} workspace is ready. Explore your dashboard to get started.`,
    link: '/dashboard',
  });
  return { skipped: false };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    const user = userData?.user;
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const role = ((profile as { role?: string } | null)?.role ?? 'student').toLowerCase();

    let result: { skipped: boolean };
    if (role === 'student') result = await seedStudent(supabase, user.id);
    else if (role === 'teacher') result = await seedTeacher(supabase, user.id);
    else if (role === 'guardian') result = await seedGuardian(supabase, user.id);
    else result = await seedGeneric(supabase, user.id, role);

    return new Response(JSON.stringify({ ok: true, role, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('seed-starter-data error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
