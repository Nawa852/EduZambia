import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target, BookOpen, Award, TrendingUp, Calendar, ChevronRight,
  Code2, Sparkles, GraduationCap, FlaskConical, Users, CalendarDays,
  CheckCircle2, ArrowRight, Trophy,
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useProfile } from '@/hooks/useProfile';

const Sparkline = ({ color, points }: { color: string; points: string }) => (
  <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
    <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
  </svg>
);

export default function SkillsDashboardView() {
  const navigate = useNavigate();
  const { isDemo } = useAuth();
  const { profile } = useProfile();
  const firstName = (profile?.full_name || 'Learner').split(' ')[0];

  const stats = isDemo ? [
    { icon: Target, label: 'Skills Acquired', value: '42', sub: '+6 this month', tint: 'bg-violet-500/10 text-violet-600', line: '0,22 15,18 30,20 45,14 60,12 75,8 90,6 100,4', stroke: '#8b5cf6' },
    { icon: BookOpen, label: 'Courses Completed', value: '12', sub: '+3 this month', tint: 'bg-emerald-500/10 text-emerald-600', line: '0,24 15,22 30,20 45,18 60,16 75,12 90,10 100,8', stroke: '#10b981' },
    { icon: Award, label: 'Badges Earned', value: '18', sub: '+4 this month', tint: 'bg-amber-500/10 text-amber-600', line: '0,20 15,22 30,18 45,20 60,14 75,16 90,10 100,12', stroke: '#f59e0b' },
    { icon: TrendingUp, label: 'XP Points', value: '2,450', sub: '+320 this month', tint: 'bg-blue-500/10 text-blue-600', line: '0,26 15,22 30,20 45,16 60,14 75,10 90,8 100,4', stroke: '#3b82f6' },
  ] : [
    { icon: Target, label: 'Skills Acquired', value: '0', sub: 'Start learning', tint: 'bg-violet-500/10 text-violet-600', line: '0,25 100,25', stroke: '#8b5cf6' },
    { icon: BookOpen, label: 'Courses Completed', value: '0', sub: 'Browse courses', tint: 'bg-emerald-500/10 text-emerald-600', line: '0,25 100,25', stroke: '#10b981' },
    { icon: Award, label: 'Badges Earned', value: '0', sub: 'Earn your first', tint: 'bg-amber-500/10 text-amber-600', line: '0,25 100,25', stroke: '#f59e0b' },
    { icon: TrendingUp, label: 'XP Points', value: '0', sub: 'Level up', tint: 'bg-blue-500/10 text-blue-600', line: '0,25 100,25', stroke: '#3b82f6' },
  ];

  const skills = isDemo ? [
    { icon: 'JS', name: 'JavaScript', level: 'Advanced', pct: 85, color: '#8b5cf6', chip: 'bg-violet-500/10 text-violet-700', bg: 'bg-amber-400' },
    { icon: 'Py', name: 'Python', level: 'Advanced', pct: 78, color: '#10b981', chip: 'bg-emerald-500/10 text-emerald-700', bg: 'bg-blue-500' },
    { icon: '⚛', name: 'React', level: 'Intermediate', pct: 65, color: '#3b82f6', chip: 'bg-blue-500/10 text-blue-700', bg: 'bg-cyan-400' },
    { icon: 'DB', name: 'SQL', level: 'Intermediate', pct: 60, color: '#6366f1', chip: 'bg-indigo-500/10 text-indigo-700', bg: 'bg-violet-500' },
    { icon: '🎨', name: 'UI/UX Design', level: 'Beginner', pct: 40, color: '#f97316', chip: 'bg-orange-500/10 text-orange-700', bg: 'bg-pink-400' },
  ] : [];

  const paths = isDemo ? [
    { icon: Code2, title: 'Full Stack Developer', pct: 78, tint: 'bg-emerald-500/10 text-emerald-600', bar: 'bg-emerald-500' },
    { icon: Sparkles, title: 'Cloud Computing Basics', pct: 45, tint: 'bg-blue-500/10 text-blue-600', bar: 'bg-blue-500' },
    { icon: FlaskConical, title: 'AI & Machine Learning', pct: 30, tint: 'bg-violet-500/10 text-violet-600', bar: 'bg-violet-500' },
  ] : [];

  const recommended = isDemo ? [
    { title: 'Advanced JavaScript Concepts', by: 'Synapse Academy', rating: 4.8, level: 'Intermediate', tint: 'bg-amber-500' },
    { title: 'AWS Cloud Practitioner', by: 'Amazon Web Services', rating: 4.7, level: 'Beginner', tint: 'bg-slate-800' },
    { title: 'UI/UX Design with Figma', by: 'Learn Design', rating: 4.6, level: 'Beginner', tint: 'bg-violet-500' },
  ] : [];

  const activities = isDemo ? [
    { icon: CheckCircle2, title: 'Completed: Python Data Structures', desc: 'Earned 150 XP', when: '2h ago', tint: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Award, title: 'Earned Badge: Problem Solver', desc: 'Solved 50 coding challenges', when: '1d ago', tint: 'bg-amber-500/10 text-amber-600' },
    { icon: BookOpen, title: 'Enrolled: Advanced SQL', desc: 'Continue learning', when: '2d ago', tint: 'bg-blue-500/10 text-blue-600' },
  ] : [];

  const goals = isDemo ? [
    { icon: Target, title: 'Complete React Course', desc: 'By May 30, 2025', pct: 65, bar: 'bg-emerald-500' },
    { icon: Award, title: 'Earn Next Badge', desc: 'Code Master', pct: 60, bar: 'bg-amber-500' },
    { icon: TrendingUp, title: 'Reach 3,000 XP', desc: 'Keep learning to level up!', pct: 82, bar: 'bg-blue-500' },
  ] : [];

  const quickActions = [
    { icon: BookOpen, label: 'Browse Courses', tint: 'bg-violet-500/10 text-violet-600', to: '/courses' },
    { icon: GraduationCap, label: 'Skill Assessment', tint: 'bg-emerald-500/10 text-emerald-600', to: '/skills-lab' },
    { icon: FlaskConical, label: 'Practice Labs', tint: 'bg-blue-500/10 text-blue-600', to: '/skills-lab' },
    { icon: Award, label: 'Certificates', tint: 'bg-amber-500/10 text-amber-600', to: '/skill-passport' },
    { icon: Users, label: 'Mentorship', tint: 'bg-rose-500/10 text-rose-600', to: '/mentorship' },
    { icon: CalendarDays, label: 'Learning Calendar', tint: 'bg-cyan-500/10 text-cyan-600', to: '/calendar' },
  ];

  return (
    <div className="space-y-5 pb-24 lg:pb-8 max-w-[1280px] mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge className="mb-2 uppercase tracking-wider text-[10px] bg-violet-500/10 text-violet-700 border-0">Skills & Development</Badge>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight flex items-center gap-2">
            Your Growth Journey <span>🌱</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Build skills. Earn badges. Unlock opportunities.</p>
        </div>
        <Card className="px-3 py-2 rounded-2xl border-border/40 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium">This Month</span>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 rounded-2xl border-border/40">
            <div className={`w-8 h-8 rounded-xl ${s.tint} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-extrabold mt-1">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mb-2">{s.sub}</div>
            <Sparkline color={s.stroke} points={s.line} />
          </Card>
        ))}
      </div>

      <Card className="p-4 lg:p-5 rounded-2xl border-border/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Skill Proficiency Overview</h2>
          <button className="text-xs text-primary font-medium flex items-center gap-1">View full report <ArrowRight className="w-3 h-3" /></button>
        </div>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Take a skill assessment to see your proficiency.</p>
        ) : (
          <div className="space-y-3.5">
            {skills.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${s.bg} text-white flex items-center justify-center font-bold text-sm shrink-0`}>{s.icon}</div>
                <div className="w-32 shrink-0">
                  <div className="text-sm font-semibold truncate">{s.name}</div>
                </div>
                <Badge className={`${s.chip} border-0 text-[10px] shrink-0`}>{s.level}</Badge>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
                <div className="text-xs font-bold w-10 text-right">{s.pct}%</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">My Learning Paths</h2>
            <button onClick={() => navigate('/learning-paths')} className="text-xs text-primary font-medium">View all</button>
          </div>
          {paths.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Enroll in a learning path to begin.</p>
          ) : (
            <div className="space-y-3">
              {paths.map((p) => (
                <button key={p.title} onClick={() => navigate('/learning-paths')} className="w-full flex items-center gap-3 group">
                  <div className={`w-10 h-10 rounded-xl ${p.tint} flex items-center justify-center shrink-0`}>
                    <p.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold group-hover:text-primary transition-colors">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground">{p.pct}% Complete</div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div className={`h-full rounded-full ${p.bar}`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
              <button onClick={() => navigate('/learning-paths')} className="w-full text-xs text-primary font-medium mt-2 flex items-center justify-center gap-1">
                Explore all paths <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Recommended Courses</h2>
            <button onClick={() => navigate('/courses')} className="text-xs text-primary font-medium">View all</button>
          </div>
          {recommended.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Browse the course catalog to get recommendations.</p>
          ) : (
            <div className="space-y-3">
              {recommended.map((r) => (
                <button key={r.title} onClick={() => navigate('/courses')} className="w-full flex items-center gap-3 group">
                  <div className={`w-11 h-11 rounded-xl ${r.tint} text-white flex items-center justify-center shrink-0 font-bold text-xs`}>
                    {r.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground">by {r.by}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-amber-500">★ {r.rating}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-0 text-[10px]">{r.level}</Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Recent Activities</h2>
            <button className="text-xs text-primary font-medium">View all</button>
          </div>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Your activity feed will appear here.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${a.tint} flex items-center justify-center shrink-0`}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground">{a.desc}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">{a.when}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Upcoming Goals</h2>
            <button className="text-xs text-primary font-medium">View all</button>
          </div>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Set goals to level up faster.</p>
          ) : (
            <div className="space-y-3">
              {goals.map((g, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <g.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{g.title}</div>
                    <div className="text-[11px] text-muted-foreground">{g.desc}</div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div className={`h-full rounded-full ${g.bar}`} style={{ width: `${g.pct}%` }} />
                    </div>
                  </div>
                  <div className="text-xs font-bold shrink-0">{g.pct}%</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4 rounded-2xl border-border/40">
        <h2 className="font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5">
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => navigate(a.to)} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
              <div className={`w-12 h-12 rounded-2xl ${a.tint} flex items-center justify-center`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 rounded-2xl border-border/40 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-lg font-extrabold flex items-center gap-2"><Trophy className="w-5 h-5" /> Ready to unlock the next level?</div>
            <div className="text-sm opacity-90 mt-1">Take a fresh skill assessment and get a personalized path.</div>
          </div>
          <button onClick={() => navigate('/skills-lab')} className="px-4 py-2 rounded-full bg-white text-violet-700 font-semibold text-sm">Start Assessment</button>
        </div>
        <div className="absolute -bottom-4 -right-4 text-7xl opacity-20 select-none">🚀</div>
      </Card>
    </div>
  );
}
