import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Scheduled job. It fans out over every guardian link with service-role
 * privileges, so it must never be callable by the public: the caller has to
 * present the shared CRON_SECRET.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const provided = req.headers.get("x-cron-secret")
    ?? (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!cronSecret || provided !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all active guardian links
    const { data: links } = await supabase.from("guardian_links").select("*").eq("status", "active");
    if (!links?.length) return new Response(JSON.stringify({ message: "No active links" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let generated = 0;

    for (const link of links) {
      const studentId = link.student_id;

      // Lessons completed this week
      const { count: lessonsCompleted } = await supabase.from("lesson_completions").select("*", { count: "exact", head: true }).eq("user_id", studentId).gte("completed_at", weekAgo);

      // Focus minutes this week
      const { data: focusSessions } = await supabase.from("focus_sessions").select("focus_minutes").eq("user_id", studentId).gte("started_at", weekAgo);
      const focusMinutes = focusSessions?.reduce((s, f) => s + (f.focus_minutes || 0), 0) || 0;

      // Quizzes this week
      const { data: quizzes } = await supabase.from("quiz_attempts").select("correct_answers, total_questions").eq("user_id", studentId).gte("created_at", weekAgo);
      const quizzesPassed = quizzes?.filter(q => q.total_questions > 0 && (q.correct_answers / q.total_questions) >= 0.7).length || 0;

      // Average grade
      const { data: grades } = await supabase.from("grades").select("score").eq("student_id", studentId);
      const avgGrade = grades?.length ? Math.round(grades.reduce((s, g) => s + (g.score || 0), 0) / grades.length) : null;

      await supabase.from("guardian_reports").insert({
        guardian_link_id: link.id,
        student_id: studentId,
        report_data: {
          lessons_completed: lessonsCompleted || 0,
          focus_minutes: focusMinutes,
          quizzes_passed: quizzesPassed,
          avg_grade: avgGrade,
          period: `${new Date(weekAgo).toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
        },
      });
      generated++;
    }

    return new Response(JSON.stringify({ message: `Generated ${generated} reports` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("guardian-weekly-digest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
