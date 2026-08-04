import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useTeacherStats } from "@/hooks/useTeacherStats";
import { TeacherShell } from "@/components/Teacher/TeacherShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, Users, ClipboardList, TrendingUp, Plus, Calendar as CalIcon,
  Sparkles, FileText, ArrowRight, AlertTriangle, CheckCircle2, Wand2,
  Megaphone, BarChart3, FolderUp, GraduationCap,
} from "lucide-react";

/* ------------------------------------------------------------------ */

const TONES = [
  { card: "bg-blue-500/[0.07] border-blue-500/15", icon: "bg-blue-500/12 text-blue-600" },
  { card: "bg-emerald-500/[0.07] border-emerald-500/15", icon: "bg-emerald-500/12 text-emerald-600" },
  { card: "bg-amber-500/[0.07] border-amber-500/15", icon: "bg-amber-500/12 text-amber-600" },
  { card: "bg-violet-500/[0.07] border-violet-500/15", icon: "bg-violet-500/12 text-violet-600" },
];

function Stat({ icon: Icon, label, value, sub, tone, to }: {
  icon: typeof BookOpen; label: string; value: string | number; sub: string;
  tone: typeof TONES[number]; to: string;
}) {
  return (
    <Link
      to={to}
      className={`rounded-[20px] border p-4 block transition-all active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-elevated ${tone.card}`}
    >
      <span className={`w-10 h-10 rounded-[14px] flex items-center justify-center mb-3 ${tone.icon}`}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <p className="text-[26px] font-extrabold leading-none tracking-[-0.03em]">{value}</p>
      <p className="text-[12.5px] font-semibold mt-1.5 leading-tight">{label}</p>
      <p className="text-[11px] text-muted-foreground leading-snug">{sub}</p>
    </Link>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="rounded-[22px] border-border/40 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <h2 className="text-[14.5px] font-bold tracking-[-0.015em]">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Empty({ icon: Icon, title, body, cta, to }: {
  icon: typeof BookOpen; title: string; body: string; cta?: string; to?: string;
}) {
  return (
    <div className="text-center py-7 px-3">
      <span className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
        <Icon className="w-[18px] h-[18px] text-muted-foreground" />
      </span>
      <p className="text-[13.5px] font-semibold">{title}</p>
      <p className="text-[12px] text-muted-foreground mt-1 max-w-xs mx-auto leading-snug">{body}</p>
      {cta && to && (
        <Link to={to}>
          <Button size="sm" className="rounded-full mt-3.5 h-9 px-4 text-[13px]">{cta}</Button>
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const QUICK_ACTIONS = [
  { label: "Lesson plan", icon: FileText, to: "/teach?tab=lesson-plans" },
  { label: "Test generator", icon: Wand2, to: "/teach?tab=test-generator" },
  { label: "New assignment", icon: ClipboardList, to: "/assignments" },
  { label: "Attendance", icon: CalIcon, to: "/attendance" },
  { label: "Announcement", icon: Megaphone, to: "/teach?tab=announcements" },
  { label: "Upload material", icon: FolderUp, to: "/teach?tab=my-materials" },
];

const TeacherDashboardV2 = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const {
    courses, totalStudents, pendingCount, avgPerformance,
    pendingSubmissions, studentAlerts, loading,
  } = useTeacherStats();

  const name = (profile?.full_name || "Teacher").split(" ")[0];
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <TeacherShell>
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] sm:text-[30px] font-extrabold tracking-[-0.035em] leading-tight">
            Good day, {name}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {pendingCount > 0
              ? `${pendingCount} submission${pendingCount === 1 ? "" : "s"} waiting to be marked.`
              : "Nothing is waiting on you. Good time to plan ahead."}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/70 border border-border/40 text-[12px] font-medium">
          <CalIcon className="w-3.5 h-3.5 text-primary" />
          {today}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[128px] rounded-[20px]" />)
          : (
            <>
              <Stat icon={BookOpen} label="Classes" value={courses.length} sub="Courses you run" tone={TONES[0]} to="/teach?tab=courses" />
              <Stat icon={Users} label="Students" value={totalStudents} sub="Enrolled with you" tone={TONES[1]} to="/teacher/students" />
              <Stat icon={ClipboardList} label="To mark" value={pendingCount} sub="Ungraded submissions" tone={TONES[2]} to="/gradebook" />
              <Stat icon={TrendingUp} label="Average" value={avgPerformance ? `${avgPerformance}%` : "—"} sub="Across graded work" tone={TONES[3]} to="/teach?tab=analytics" />
            </>
          )}
      </div>

      {/* Co-Pilot banner */}
      <Card className="rounded-[24px] border-primary/15 bg-gradient-to-br from-primary/[0.10] via-violet-500/[0.06] to-transparent p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <span className="w-11 h-11 rounded-[16px] bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15.5px] font-bold tracking-[-0.02em]">Curriculum Co-Pilot</p>
            <p className="text-[12.5px] text-muted-foreground leading-snug mt-0.5">
              Draft an ECZ-aligned lesson, a scheme of work or a full test with charts — in under a minute.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                className="rounded-full h-9 px-4 text-[13px] font-semibold bg-gradient-to-r from-primary to-violet-600 shadow-lg shadow-primary/20"
                onClick={() => navigate("/teacher/copilot")}
              >
                Plan a lesson
              </Button>
              <Button variant="outline" className="rounded-full h-9 px-4 text-[13px]" onClick={() => navigate("/teach?tab=test-generator")}>
                <Wand2 className="w-3.5 h-3.5 mr-1.5" />Generate a test
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <div>
        <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase px-0.5 mb-2.5">
          Quick actions
        </h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className="shrink-0 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-3.5 h-10 text-[13px] font-medium hover:border-primary/30 hover:bg-primary/[0.04] transition-colors active:scale-[0.97]"
            >
              <a.icon className="w-4 h-4 text-primary" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* Classes */}
        <SectionCard
          title="My classes"
          action={<Link to="/teach?tab=courses" className="text-[12px] font-semibold text-primary">View all</Link>}
        >
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : courses.length === 0 ? (
            <Empty
              icon={BookOpen}
              title="No classes yet"
              body="Create your first course and invite students with a join code."
              cta="Create a class"
              to="/teach?tab=courses"
            />
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 5).map((c) => (
                <Link key={c.id} to={`/teach?tab=courses`} className="flex items-center gap-3 group">
                  <span className="w-10 h-10 rounded-[14px] bg-primary/10 text-primary grid place-items-center text-[14px] font-bold shrink-0">
                    {(c.subject || c.title || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-semibold truncate group-hover:text-primary transition-colors">{c.title}</span>
                    <span className="block text-[11.5px] text-muted-foreground">
                      {c.enrollment_count} student{c.enrollment_count === 1 ? "" : "s"}
                      {!c.is_published && " · draft"}
                    </span>
                  </span>
                  <span className="w-24 shrink-0">
                    <Progress value={c.avg_score ?? 0} className="h-1.5" />
                  </span>
                  <span className="text-[11.5px] font-bold w-9 text-right shrink-0">
                    {c.avg_score != null ? `${c.avg_score}%` : "—"}
                  </span>
                </Link>
              ))}
              <Link to="/teach?tab=courses" className="flex items-center justify-center gap-1 text-[13px] text-primary font-semibold pt-1">
                <Plus className="w-4 h-4" /> Add a class
              </Link>
            </div>
          )}
        </SectionCard>

        {/* To mark */}
        <SectionCard
          title="Waiting to be marked"
          action={<Link to="/gradebook" className="text-[12px] font-semibold text-primary">Gradebook</Link>}
        >
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : pendingSubmissions.length === 0 ? (
            <Empty
              icon={CheckCircle2}
              title="All caught up"
              body="Every submission from your students has been graded."
            />
          ) : (
            <div className="space-y-2.5">
              {pendingSubmissions.slice(0, 5).map((s) => (
                <Link
                  key={s.id}
                  to="/gradebook"
                  className="flex items-center gap-3 rounded-[16px] border border-border/40 p-2.5 hover:border-primary/30 transition-colors"
                >
                  <span className="w-9 h-9 rounded-[12px] bg-amber-500/12 text-amber-600 grid place-items-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold truncate">{s.assignment_title}</span>
                    <span className="block text-[11.5px] text-muted-foreground truncate">
                      {s.student_name}{s.course_title ? ` · ${s.course_title}` : ""}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Students needing help */}
        <SectionCard
          title="Students needing help"
          action={<Link to="/teacher/students" className="text-[12px] font-semibold text-primary">All students</Link>}
        >
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : studentAlerts.length === 0 ? (
            <Empty
              icon={GraduationCap}
              title="No alerts"
              body="Once your students submit work, anyone falling behind shows up here."
            />
          ) : (
            <div className="space-y-2.5">
              {studentAlerts.slice(0, 5).map((a) => (
                <div key={`${a.student_id}-${a.course_title}`} className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-[12px] grid place-items-center shrink-0 ${
                    a.severity === "high" ? "bg-rose-500/12 text-rose-600" : "bg-amber-500/12 text-amber-600"
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold truncate">{a.student_name}</span>
                    <span className="block text-[11.5px] text-muted-foreground truncate">{a.issue}</span>
                  </span>
                  <Badge variant="outline" className="rounded-full text-[10px] shrink-0">{a.course_title}</Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Class performance */}
        <SectionCard
          title="Class performance"
          action={<Link to="/teach?tab=analytics" className="text-[12px] font-semibold text-primary">Analytics</Link>}
        >
          {loading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : courses.filter((c) => c.avg_score != null).length === 0 ? (
            <Empty
              icon={BarChart3}
              title="No graded work yet"
              body="Averages appear here as soon as you grade the first submissions."
            />
          ) : (
            <div className="space-y-3.5">
              {courses.filter((c) => c.avg_score != null).slice(0, 6).map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12.5px] font-medium truncate pr-3">{c.title}</span>
                    <span className="text-[12.5px] font-bold shrink-0">{c.avg_score}%</span>
                  </div>
                  <Progress value={c.avg_score ?? 0} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </TeacherShell>
  );
};

export default TeacherDashboardV2;
