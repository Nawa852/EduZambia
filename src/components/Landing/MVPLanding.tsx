import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { motion } from 'framer-motion';
import {
  ArrowRight, Brain, BookOpen, Target, Check, Sparkles,
  GraduationCap, Users, Building, Globe, Mail, Heart, Play, Award, Clock, Zap, Star, Shield, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import eduMark from '@/assets/edu-zambia-icon.png';

const features = [
  { icon: Brain, title: 'AI Tutor', desc: 'Personal AI that adapts to how you learn — ask anything, anytime.', color: 'from-blue-500/20 to-cyan-500/20' },
  { icon: Target, title: 'ECZ Exam Prep', desc: 'Real past papers, timed simulations, and instant marking.', color: 'from-purple-500/20 to-pink-500/20' },
  { icon: BookOpen, title: 'Smart Courses', desc: 'Grade 7–12 courses with video lessons and progress tracking.', color: 'from-emerald-500/20 to-green-500/20' },
  { icon: Award, title: 'Gamified Learning', desc: 'Earn XP, badges, and climb leaderboards as you learn.', color: 'from-amber-500/20 to-orange-500/20' },
  { icon: Clock, title: 'Focus Mode', desc: 'Distraction-free study with Pomodoro timer and stats.', color: 'from-rose-500/20 to-red-500/20' },
  { icon: Users, title: 'Study Groups', desc: 'Collaborate with classmates, share notes, learn together.', color: 'from-indigo-500/20 to-violet-500/20' },
];

const roles = [
  { icon: GraduationCap, title: 'Students', desc: 'AI tutoring, quizzes, and exam prep', emoji: '🎓' },
  { icon: Users, title: 'Teachers', desc: 'Course builder, gradebook, analytics', emoji: '👩‍🏫' },
  { icon: Heart, title: 'Parents', desc: 'Track progress, communicate with teachers', emoji: '👨‍👩‍👧' },
  { icon: Building, title: 'Schools', desc: 'Admin dashboard, curriculum management', emoji: '🏫' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const MVPLanding = () => {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleDemo = () => {
    enterDemoMode();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/10">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={eduMark} alt="Nexus Learning" className="w-9 h-9 rounded-xl shadow-card transition-transform group-hover:scale-105" />
            <span className="font-extrabold text-base text-foreground tracking-tight">Edu Zambia</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#roles" className="hover:text-foreground transition-colors">Who It's For</a>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDemo} className="font-medium text-xs h-8 px-3 rounded-full hidden sm:flex">
              Try Demo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="font-medium h-8 px-3 rounded-full text-xs">
              Log in
            </Button>
            <Button size="sm" onClick={() => navigate('/auth?mode=signup')} className="font-semibold gap-1.5 h-9 px-5 rounded-full text-xs shadow-lg shadow-primary/25">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 sm:pt-36 pb-16 sm:pb-24 px-4 relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/[0.06] blur-[150px]" />
          <div className="absolute bottom-[-100px] right-[-200px] w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-[120px]" />
          <div className="absolute top-[200px] left-[-200px] w-[400px] h-[400px] rounded-full bg-purple-500/[0.03] blur-[100px]" />
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="container mx-auto max-w-3xl text-center relative z-10">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-8 border border-primary/15 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Learning Platform
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">NEW</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-[2.25rem] leading-[1.05] sm:text-[3.5rem] md:text-[4rem] font-extrabold tracking-[-0.03em] mb-5">
            <span className="text-foreground">Study Smarter.</span>
            <br />
            <span className="gradient-text">Score Higher.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-sm sm:text-[17px] text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed">
            AI tutors, exam practice, smart courses, and study tools — everything Zambian students need to succeed.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/auth?mode=signup')} className="w-full sm:w-auto h-13 px-8 text-[15px] font-semibold rounded-2xl shadow-xl shadow-primary/25 gap-2.5 hover:shadow-2xl hover:shadow-primary/30 transition-all">
              Start Learning Free
              <ArrowRight className="w-4.5 h-4.5" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleDemo} className="w-full sm:w-auto h-13 px-8 text-[15px] font-semibold rounded-2xl gap-2.5 border-border/40 hover:bg-secondary/80">
              <Play className="w-4 h-4 fill-current" />
              Try Demo
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground mt-10">
            {[
              { icon: Check, text: '100% Free' },
              { icon: Shield, text: 'ECZ Aligned' },
              { icon: Zap, text: 'Works Offline' },
            ].map((item) => (
              <span key={item.text} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
                  <item.icon className="w-3 h-3 text-accent" />
                </span>
                {item.text}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Social proof strip */}
      <section className="py-8 sm:py-10 border-y border-border/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              { n: '50K+', l: 'Students', icon: GraduationCap },
              { n: '2,500+', l: 'Teachers', icon: Users },
              { n: '150+', l: 'Schools', icon: Building },
              { n: '10', l: 'Provinces', icon: Globe },
            ].map((s) => (
              <div key={s.l} className="text-center group">
                <div className="w-10 h-10 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/12 transition-colors">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{s.n}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mt-1 font-semibold">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-[11px] font-semibold mb-5 border border-border/30">
              <Star className="w-3 h-3 text-primary" /> Platform Features
            </div>
            <h2 className="text-2xl sm:text-[2.5rem] font-extrabold mb-3 tracking-tight leading-tight">
              Everything You Need to <span className="text-primary">Succeed</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">Powerful AI tools built for Zambian students and educators</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <div className="h-full p-5 rounded-2xl border border-border/20 bg-card/60 hover:bg-card hover:border-primary/20 hover:shadow-elevated transition-all duration-300 group cursor-default">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <f.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-bold text-[15px] text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section id="roles" className="py-16 sm:py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-3xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-[2.5rem] font-extrabold mb-3 tracking-tight leading-tight">Built for <span className="text-primary">Everyone</span></h2>
            <p className="text-sm sm:text-base text-muted-foreground">Whether you're a student, teacher, parent, or admin</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map((r, i) => (
              <motion.div key={r.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/20 hover:border-primary/20 hover:shadow-elevated transition-all duration-300 group">
                  <div className="text-2xl">{r.emoji}</div>
                  <div>
                    <h3 className="font-bold text-[15px] text-foreground mb-0.5">{r.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App preview / trust section */}
      <section className="py-16 sm:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-border/20 p-8 sm:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.08),transparent_60%)]" />
              <div className="relative grid sm:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold mb-3 tracking-tight">Trusted by top schools across Zambia</h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Join the growing community of learners and educators transforming education with AI.</p>
                  <div className="flex items-center gap-1 mb-4">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-sm font-semibold ml-2">4.9</span>
                    <span className="text-xs text-muted-foreground ml-1">from 2,400+ reviews</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Avg. Grade Improvement', value: '+23%', icon: TrendingUp },
                    { label: 'Student Satisfaction', value: '98%', icon: Heart },
                    { label: 'Study Hours Saved', value: '40%', icon: Clock },
                    { label: 'Pass Rate Increase', value: '+31%', icon: Award },
                  ].map(stat => (
                    <div key={stat.label} className="p-4 rounded-2xl bg-background/60 backdrop-blur-sm border border-border/20 text-center">
                      <stat.icon className="w-4 h-4 text-primary mx-auto mb-2" />
                      <p className="text-xl font-extrabold text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 px-4">
        <div className="container mx-auto max-w-xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mx-auto mb-7 shadow-lg shadow-primary/10">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-[2.5rem] font-extrabold mb-3 tracking-tight leading-tight">Ready to Transform<br />Your Learning?</h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base max-w-md mx-auto">Join thousands of students already learning smarter with AI.</p>
            <Button size="lg" onClick={() => navigate('/auth?mode=signup')} className="h-13 px-10 text-[15px] font-semibold rounded-2xl shadow-xl shadow-primary/25 gap-2.5">
              Get Started Free <ArrowRight className="w-4.5 h-4.5" />
            </Button>
            <p className="text-[11px] text-muted-foreground mt-6 font-medium">No credit card required • Free forever plan</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/10 py-8 px-4">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <img src={eduMark} alt="Nexus Learning" className="w-6 h-6 rounded-lg" />
            <span className="text-xs">© 2026 Edu Zambia. Made with <Heart className="w-3 h-3 inline text-destructive fill-current" /> in Zambia</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <a href="mailto:hello@nexuslearning.com" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MVPLanding;
