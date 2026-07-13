import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap, Users, Heart, Building2, Briefcase, Code2, Landmark, ArrowRight, PlayCircle,
} from 'lucide-react';

const ROLES = [
  { id: 'student',     title: 'Student',      desc: 'ECZ learner. Courses, AI tutor, study tools, exams.', icon: GraduationCap, gradient: 'from-blue-500 to-indigo-600' },
  { id: 'teacher',     title: 'Teacher',      desc: 'Plan lessons, generate tests with charts, grade with AI.', icon: Users, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'guardian',    title: 'Parent / Guardian', desc: 'Track your child\'s progress, attendance, performance.', icon: Heart, gradient: 'from-rose-500 to-pink-600' },
  { id: 'institution', title: 'School Admin', desc: 'Run a school: students, staff, fees, analytics.',     icon: Building2, gradient: 'from-amber-500 to-orange-600' },
  { id: 'entrepreneur',title: 'Entrepreneur', desc: 'Ventures, funding, bounties, pitch decks, market research.', icon: Briefcase, gradient: 'from-violet-500 to-purple-600' },
  { id: 'developer',   title: 'Developer',    desc: 'IDE, AI code review, hackathons, skill challenges.',  icon: Code2, gradient: 'from-cyan-500 to-blue-600' },
  { id: 'ministry',    title: 'Ministry / NGO', desc: 'Policy, school registry, interventions, donor impact.', icon: Landmark, gradient: 'from-slate-600 to-zinc-700' },
];

export default function DemoRolePicker() {
  const navigate = useNavigate();
  const { enterDemoMode } = useAuth();
  const pick = (id: string) => {
    sessionStorage.setItem('demo_role', id);
    sessionStorage.setItem('demo_mode', '1');
    sessionStorage.setItem('demo_started', Date.now().toString());
    localStorage.setItem('edu-zambia-user-type', id);
    localStorage.setItem('edu-zambia-onboarding-completed', 'true');
    enterDemoMode();
    const map: Record<string, string> = {
      student: '/dashboard?demo=1&tour=1',
      teacher: '/teach?demo=1&tour=1',
      guardian: '/family?demo=1',
      institution: '/admin?demo=1',
      entrepreneur: '/entrepreneur?demo=1',
      developer: '/developer?demo=1',
      ministry: '/ministry?demo=1',
    };
    navigate(map[id] || '/dashboard?demo=1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <PlayCircle className="w-3.5 h-3.5" /> Interactive demo
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">How do you want to demo Synapse?</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pick a role — we&apos;ll show you the dashboard, AI tools and workflows built for that user.
            No signup needed.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map(r => {
            const Icon = r.icon;
            return (
              <Card
                key={r.id}
                onClick={() => pick(r.id)}
                className="group p-5 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all border-border/60"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center mb-4 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{r.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{r.desc}</p>
                <div className="flex items-center text-xs font-medium text-primary group-hover:gap-2 gap-1 transition-all">
                  Start demo <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Button variant="ghost" onClick={() => navigate('/auth')} className="text-xs">
            Or create a real account →
          </Button>
        </div>
      </div>
    </div>
  );
}
