import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Brain, BookOpen, GraduationCap, Target, Sparkles, Users,
  Rocket, HeartPulse, Wrench, ArrowRight, Play, LogIn, ShieldCheck, WifiOff, Globe2,
} from 'lucide-react';
import eduMark from '@/assets/edu-zambia-icon.png';

type Feature = {
  label: string;
  desc: string;
  icon: typeof Brain;
  to: string;
};

const FEATURES: Feature[] = [
  { label: 'AI Tutor',       desc: 'Ask anything, in English or Bemba, 24/7',   icon: Brain,        to: '/ai' },
  { label: 'ECZ Exams',      desc: 'Past papers, mocks & predictions',          icon: Target,       to: '/ecz' },
  { label: 'Learn',          desc: 'Courses, lessons & video library',          icon: GraduationCap,to: '/learn' },
  { label: 'Free Courses',   desc: 'Harvard, MIT & YC content — free',          icon: Sparkles,     to: '/free-courses' },
  { label: 'Study',          desc: 'Focus mode, notes & flashcards',            icon: BookOpen,     to: '/study' },
  { label: 'Community',      desc: 'Study groups, mentors & messaging',         icon: Users,        to: '/connect' },
  { label: 'Entrepreneur',   desc: 'Build a venture, find funding',             icon: Rocket,       to: '/entrepreneur' },
  { label: 'Healthcare',     desc: 'Clinical learning for med students',        icon: HeartPulse,   to: '/medical' },
  { label: 'Developer',      desc: 'Code, AI reviews & ship projects',          icon: Wrench,       to: '/developer' },
];

const AUDIENCES = [
  { title: 'Students',      body: 'Grade 1-12, ECZ-aligned. Bemba, Nyanja, Tonga, Lozi.' },
  { title: 'Teachers',      body: 'Auto-generate lessons, mark faster, track your class.' },
  { title: 'Parents',       body: 'Real progress reports, screen limits, guardian mode.' },
  { title: 'Institutions',  body: 'School dashboards, curriculum tools, analytics.' },
];

const TRUST = [
  { icon: WifiOff,     label: 'Works offline' },
  { icon: ShieldCheck, label: 'Child-safe by default' },
  { icon: Globe2,      label: '5 local languages' },
];

const SplashLanding = () => {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const tryDemo = () => { enterDemoMode(); navigate('/dashboard'); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={eduMark} alt="Synapse" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg">Synapse</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={tryDemo} className="hidden sm:inline-flex">
              <Play className="w-4 h-4 mr-1.5" /> Try demo
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login"><LogIn className="w-4 h-4 mr-1.5" /> Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 sm:pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Built for Zambia — ECZ curriculum, offline-ready
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
            Learn anything.
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Grow anywhere.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Synapse brings AI tutoring, ECZ exam prep, world-class courses and career tools into one
            place — for students, teachers, parents and every stakeholder in Zambian education.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="h-12 px-6 text-base" asChild>
              <Link to="/signup">Get started free <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-6 text-base" onClick={tryDemo}>
              <Play className="w-4 h-4 mr-2" /> Try the demo
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {TRUST.map(t => (
              <div key={t.label} className="flex items-center gap-1.5">
                <t.icon className="w-4 h-4 text-primary" /> {t.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">Everything for the whole learning journey</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            One account, every tool. Pick what you need — the rest is a tap away.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <Link
              key={f.label}
              to={f.to}
              className="group p-5 rounded-2xl border border-border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base">{f.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              <div className="mt-3 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Open <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Audiences */}
      <section className="bg-muted/30 border-y border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold">Made for everyone in the classroom — and out of it</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AUDIENCES.map(a => (
              <div key={a.title} className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">Start learning in under a minute</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Create a free account and pick your path — student, teacher, parent, developer, entrepreneur, or skills learner.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" className="h-12 px-6 text-base" asChild>
            <Link to="/signup">Create free account <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
          <Button size="lg" variant="ghost" className="h-12 px-6 text-base" onClick={tryDemo}>
            Just browse the demo
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={eduMark} alt="Synapse" className="w-6 h-6 rounded" />
            <span>© {new Date().getFullYear()} Synapse. Made in Zambia.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SplashLanding;
