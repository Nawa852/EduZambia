import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Brain, BookOpen, GraduationCap, Target, Sparkles, Users,
  Rocket, HeartPulse, Wrench, Compass, ArrowRight, Play, LogIn,
} from 'lucide-react';
import eduMark from '@/assets/edu-zambia-icon.png';

// App-launcher style splash. Replaces marketing landing with a clean tool grid.
type Tile = {
  label: string;
  desc: string;
  icon: typeof Brain;
  to: string;
  gradient: string;
};

const TILES: Tile[] = [
  { label: 'AI Tutor',       desc: 'Ask anything, 24/7',            icon: Brain,        to: '/ai',            gradient: 'from-violet-500 to-fuchsia-500' },
  { label: 'Learn',          desc: 'Courses & lessons',             icon: GraduationCap,to: '/learn',         gradient: 'from-blue-500 to-cyan-500' },
  { label: 'ECZ Exams',      desc: 'Past papers + mocks',           icon: Target,       to: '/ecz',           gradient: 'from-rose-500 to-orange-500' },
  { label: 'Free Courses',   desc: 'Harvard · MIT · YC',            icon: Sparkles,     to: '/free-courses',  gradient: 'from-amber-500 to-yellow-500' },
  { label: 'Study',          desc: 'Focus, notes & quizzes',        icon: BookOpen,     to: '/study',         gradient: 'from-emerald-500 to-teal-500' },
  { label: 'Community',      desc: 'Groups & messages',             icon: Users,        to: '/connect',       gradient: 'from-pink-500 to-rose-500' },
  { label: 'Entrepreneur',   desc: 'Build your venture',            icon: Rocket,       to: '/entrepreneur',  gradient: 'from-indigo-500 to-blue-500' },
  { label: 'Healthcare',     desc: 'Clinical learning',             icon: HeartPulse,   to: '/medical',       gradient: 'from-red-500 to-pink-500' },
  { label: 'Developer',      desc: 'Code & ship projects',          icon: Wrench,       to: '/developer',     gradient: 'from-slate-600 to-zinc-700' },
  { label: 'Tools & More',   desc: 'Every Edu Zambia tool',         icon: Compass,      to: '/tools',         gradient: 'from-cyan-500 to-sky-500' },
];

const SplashLanding = () => {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const tryDemo = () => { enterDemoMode(); navigate('/dashboard'); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:pt-16">
        {/* Brand header */}
        <header className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-2xl" />
            <img
              src={eduMark}
              alt="Nexus Learning"
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl shadow-xl"
            />
          </div>
          <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight">
            Edu Zambia
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-md">
            Your full learning workspace — pick a tool to get started.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm" className="rounded-full">
              <Link to="/auth"><LogIn className="w-4 h-4 mr-1.5" /> Sign in</Link>
            </Button>
            <Button asChild size="sm" variant="secondary" className="rounded-full">
              <Link to="/auth?mode=signup">Create account <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="rounded-full">
              <Link to="/demo"><Play className="w-4 h-4 mr-1.5" /> Try demo</Link>
            </Button>
          </div>
        </header>

        {/* Launcher grid */}
        <section aria-label="App launcher" className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
          {TILES.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              className="group flex flex-col items-center text-center gap-2 p-2 rounded-2xl hover:bg-muted/50 active:scale-95 transition-all"
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all`}>
                <t.icon className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
              </div>
              <div>
                <p className="text-[13px] sm:text-sm font-semibold text-foreground leading-tight">{t.label}</p>
                <p className="hidden sm:block text-[11px] text-muted-foreground leading-tight mt-0.5">{t.desc}</p>
              </div>
            </Link>
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-muted-foreground space-x-3">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <span aria-hidden>·</span>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
          <span aria-hidden>·</span>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          <p className="mt-3">Made for Zambian learners 🇿🇲</p>
        </footer>
      </div>
    </div>
  );
};

export default SplashLanding;
