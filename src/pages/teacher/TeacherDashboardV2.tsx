import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { TeacherShell } from "@/components/Teacher/TeacherShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, Users, ClipboardList, TrendingUp, Plus, Calendar as CalIcon,
  Sparkles, Megaphone, FlaskConical, Video, FileText, Library, Brain,
  Bell, CheckCircle2, BarChart3, ArrowRight
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { toast } from "sonner";

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "from-blue-500 to-blue-600",
  "Add Mathematics": "from-amber-500 to-amber-600",
  Science: "from-emerald-500 to-emerald-600",
  Physics: "from-violet-500 to-violet-600",
  English: "from-rose-500 to-rose-600",
  default: "from-slate-500 to-slate-600",
};

const SCHEDULE = [
  { time: "08:00 AM", title: "Mathematics — Grade 11A", topic: "Algebraic Expressions", room: "Room 12", color: "bg-blue-500" },
  { time: "10:00 AM", title: "Mathematics — Grade 10B", topic: "Quadratic Equations", room: "Room 08", color: "bg-emerald-500" },
  { time: "01:00 PM", title: "Additional Math — 11B", topic: "Trigonometric Ratios", room: "Room 15", color: "bg-violet-500" },
  { time: "02:30 PM", title: "Mathematics — Grade 12A", topic: "Calculus — Derivatives", room: "Room 05", color: "bg-amber-500" },
];

const PROGRESS_DATA = [
  { week: "Apr 20", "Gr 11A": 60, "Gr 10B": 50, "Gr 12A": 65, "Add Math 11B": 45, "Math Club": 55 },
  { week: "Apr 27", "Gr 11A": 65, "Gr 10B": 58, "Gr 12A": 70, "Add Math 11B": 52, "Math Club": 60 },
  { week: "May 4",  "Gr 11A": 72, "Gr 10B": 65, "Gr 12A": 75, "Add Math 11B": 60, "Math Club": 64 },
  { week: "May 11", "Gr 11A": 78, "Gr 10B": 70, "Gr 12A": 80, "Add Math 11B": 68, "Math Club": 67 },
  { week: "May 18", "Gr 11A": 82, "Gr 10B": 76, "Gr 12A": 85, "Add Math 11B": 72, "Math Club": 68 },
];

const ANNOUNCEMENTS = [
  { icon: Megaphone, color: "text-blue-600 bg-blue-100", title: "ECZ Curriculum Update", body: "New Mathematics syllabus guidelines have been released.", time: "2 days ago" },
  { icon: CalIcon,   color: "text-emerald-600 bg-emerald-100", title: "Teachers' Workshop", body: "Join us for a workshop on AI in Education this Friday.", time: "5 days ago" },
  { icon: ClipboardList, color: "text-amber-600 bg-amber-100", title: "End of Term Exams", body: "Examination schedule has been published.", time: "1 week ago" },
];

const RECENT_ASSIGNMENTS = [
  { title: "Quadratic Equations Worksheet", grade: "Grade 10B", submitted: 12, total: 28, color: "text-blue-600" },
  { title: "Algebraic Expressions Quiz", grade: "Grade 11A", submitted: 26, total: 32, color: "text-emerald-600" },
  { title: "Trigonometry Problem Set", grade: "Grade 11B", submitted: 8, total: 20, color: "text-amber-600" },
  { title: "Calculus Derivatives Assignment", grade: "Grade 12A", submitted: 18, total: 24, color: "text-violet-600" },
];

const QUICK_RESOURCES = [
  { icon: FileText, label: "Lesson Plan Templates", to: "/teacher/lessons", color: "bg-blue-50 text-blue-600" },
  { icon: Library, label: "ECZ Syllabus Documents", to: "/teacher/resources", color: "bg-emerald-50 text-emerald-600" },
  { icon: ClipboardList, label: "Past Exam Papers", to: "/past-papers", color: "bg-amber-50 text-amber-600" },
  { icon: FlaskConical, label: "Interactive Simulations", to: "/simulations", color: "bg-rose-50 text-rose-600" },
  { icon: Video, label: "Video Lessons", to: "/video-learning", color: "bg-violet-50 text-violet-600" },
  { icon: Brain, label: "Question Bank", to: "/teacher/assignments", color: "bg-slate-50 text-slate-600" },
];

function Stat({ icon: Icon, label, value, sub, tone, to }: any) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className={`w-10 h-10 rounded-xl grid place-items-center ${tone}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">{label}</div>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
        {to && (
          <Link to={to} className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1">
            View {label.toLowerCase()} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default function TeacherDashboardV2() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const name = profile?.full_name?.split(" ")[0] || "Teacher";
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const { data: classes = [] } = useQuery({
    queryKey: ["teacher-classes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("classes").select("*, class_enrollments(count)").eq("teacher_id", user.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const myClasses = classes.length
    ? classes.map((c: any) => ({
        name: c.name,
        subject: c.subject || "Mathematics",
        students: c.class_enrollments?.[0]?.count ?? 0,
        progress: 70,
        color: SUBJECT_COLORS[c.subject || ""] || SUBJECT_COLORS.default,
      }))
    : [
        { name: "Mathematics — Grade 11A", subject: "Mathematics", students: 32, progress: 82, color: SUBJECT_COLORS.Mathematics },
        { name: "Mathematics — Grade 10B", subject: "Mathematics", students: 28, progress: 76, color: SUBJECT_COLORS.Mathematics },
        { name: "Mathematics — Grade 12A", subject: "Mathematics", students: 24, progress: 85, color: SUBJECT_COLORS.Mathematics },
        { name: "Additional Math — 11B", subject: "Add Mathematics", students: 20, progress: 72, color: SUBJECT_COLORS["Add Mathematics"] },
        { name: "Mathematics Club", subject: "Mathematics", students: 15, progress: 68, color: SUBJECT_COLORS.Mathematics },
      ];

  return (
    <TeacherShell>
      {/* Greeting + date */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Good morning, {name}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening in your classes today.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border text-sm">
          <CalIcon className="w-4 h-4 text-primary" />
          <span>{today}</span>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={BookOpen} label="My Classes" value={myClasses.length} sub="Active classes" tone="bg-blue-100 text-blue-700" to="/teacher/classes" />
        <Stat icon={Users} label="Students" value={myClasses.reduce((s, c) => s + (c.students || 0), 0)} sub="Total students" tone="bg-emerald-100 text-emerald-700" to="/teacher/students" />
        <Stat icon={ClipboardList} label="Assignments" value={8} sub="Pending to grade" tone="bg-amber-100 text-amber-700" to="/teacher/assignments" />
        <Stat icon={TrendingUp} label="Avg. Class Progress" value="78%" sub="This month" tone="bg-violet-100 text-violet-700" to="/teacher/reports" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Classes */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">My Classes</CardTitle>
            <Link to="/teacher/classes" className="text-xs text-primary">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {myClasses.slice(0, 5).map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center text-white text-sm font-semibold`}>
                  {c.subject[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.students} students</div>
                </div>
                <div className="w-28">
                  <Progress value={c.progress} className="h-1.5" />
                </div>
                <div className="text-xs font-semibold w-10 text-right">{c.progress}%</div>
              </div>
            ))}
            <Link to="/teacher/classes" className="flex items-center justify-center gap-1 text-sm text-primary font-medium pt-1">
              <Plus className="w-4 h-4" /> Add New Class
            </Link>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Today's Schedule</CardTitle>
            <Link to="/teacher/attendance" className="text-xs text-primary">View full calendar</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {SCHEDULE.map((s) => (
              <div key={s.time} className="flex items-start gap-3">
                <div className="text-xs font-medium w-16 pt-0.5 text-muted-foreground">{s.time}</div>
                <div className={`w-1 self-stretch rounded-full ${s.color}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.topic}</div>
                </div>
                <Badge variant="secondary" className="text-[10px]">{s.room}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Assignments</CardTitle>
            <Link to="/teacher/assignments" className="text-xs text-primary">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {RECENT_ASSIGNMENTS.map((a) => (
              <div key={a.title} className="flex items-center gap-3">
                <FileText className={`w-4 h-4 ${a.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.grade}</div>
                </div>
                <div className="text-xs">
                  <span className="font-semibold">{a.submitted}/{a.total}</span>
                  <span className="text-muted-foreground"> Submitted</span>
                </div>
              </div>
            ))}
            <Link to="/teacher/assignments" className="flex items-center justify-center gap-1 text-sm text-primary font-medium pt-1">
              <Plus className="w-4 h-4" /> Create New Assignment
            </Link>
          </CardContent>
        </Card>

        {/* Class Progress Chart */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Class Progress Overview</CardTitle>
            <Badge variant="outline" className="text-xs">This Month</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={PROGRESS_DATA}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="week" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="Gr 11A" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="Gr 10B" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Gr 12A" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="Add Math 11B" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Math Club" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Announcements + Curriculum Co-Pilot */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">School Announcements</CardTitle>
            <Link to="/teacher/communications" className="text-xs text-primary">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {ANNOUNCEMENTS.map((a) => (
              <div key={a.title} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg grid place-items-center ${a.color}`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.body}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/20">
          <CardHeader className="flex flex-row items-start justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Curriculum Co-Pilot <Sparkles className="w-4 h-4 text-primary" />
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Need help with lesson planning? Let AI Co-Pilot create engaging lessons, quizzes, and activities aligned with the ECZ curriculum.
              </p>
            </div>
            <div className="text-4xl">🤖</div>
          </CardHeader>
          <CardContent>
            <Link to="/teacher/copilot">
              <Button className="w-full">Create with Co-Pilot</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Resources */}
      <Card className="rounded-2xl mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Quick Resources</CardTitle>
          <Link to="/teacher/resources" className="text-xs text-primary">View all</Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_RESOURCES.map((r) => (
              <Link key={r.label} to={r.to} className="p-3 rounded-xl border hover:shadow-sm transition text-center">
                <div className={`w-10 h-10 mx-auto rounded-xl grid place-items-center ${r.color}`}>
                  <r.icon className="w-5 h-5" />
                </div>
                <div className="text-xs font-medium mt-2">{r.label}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Quick Actions Bar */}
      <div className="sticky bottom-0 -mx-4 lg:-mx-8 mt-8 bg-background/90 backdrop-blur border-t z-20">
        <div className="px-4 lg:px-8 py-3 flex flex-wrap items-center gap-2 justify-between">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Quick Actions
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/teacher/attendance"><Button variant="outline" size="sm"><CheckCircle2 className="w-4 h-4 mr-1.5" />Take Attendance</Button></Link>
            <Link to="/teacher/assignments"><Button variant="outline" size="sm"><ClipboardList className="w-4 h-4 mr-1.5" />Create Assignment</Button></Link>
            <Link to="/teacher/gradebook"><Button variant="outline" size="sm"><BarChart3 className="w-4 h-4 mr-1.5" />Record Grades</Button></Link>
            <Link to="/teacher/communications"><Button size="sm"><Megaphone className="w-4 h-4 mr-1.5" />Send Announcement</Button></Link>
          </div>
        </div>
      </div>
    </TeacherShell>
  );
}
