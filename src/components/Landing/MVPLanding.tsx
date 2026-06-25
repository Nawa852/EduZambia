import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { motion } from 'framer-motion';
import {
  ArrowRight, Brain, BookOpen, Target, Check, Sparkles,
  GraduationCap, Users, Building, Globe, Mail, Heart, Play, Award, Clock, Zap, Star, Shield, TrendingUp,
  Stethoscope, Code2, Landmark, Rocket, HandCoins, Network, Database, WifiOff, Layers, Infinity as InfinityIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import eduMark from '@/assets/edu-zambia-icon.png';

const pillars = [
  { icon: Brain, title: 'BrightSphere AI Tutor', desc: 'Adaptive multi-model tutor in English, Bemba, Nyanja, Tonga & Lozi — works offline.', tint: 'from-blue-500/20 to-cyan-500/20' },
  { icon: Target, title: 'ECZ Mastery Engine', desc: 'Past papers 2003–2024, timed mocks, AI marking & predictive exam readiness.', tint: 'from-purple-500/20 to-pink-500/20' },
  { icon: Award, title: 'Kinetic Ledger', desc: 'Verified skill passport — every project, grade & gig stored on a portable ledger.', tint: 'from-emerald-500/20 to-green-500/20' },
  { icon: HandCoins, title: 'Learn-to-Earn Economy', desc: 'Bounties, micro-gigs & royalty splits convert effort into income & tuition credit.', tint: 'from-amber-500/20 to-orange-500/20' },
  { icon: Stethoscope, title: 'Clinical Simulators', desc: 'Case-based simulators & Zambian drug reference for medical & nursing learners.', tint: 'from-rose-500/20 to-red-500/20' },
  { icon: Code2, title: 'Git-Driven Cloud IDE', desc: 'One-click cloud dev environments for makers on low-power devices.', tint: 'from-indigo-500/20 to-violet-500/20' },
];

const stakeholders = [
  { icon: GraduationCap, title: 'Students', desc: 'AI tutor, ECZ prep, skill passport', emoji: '🎓' },
  { icon: Users, title: 'Teachers', desc: 'Auto-grading, lesson generator, analytics', emoji: '👩🏾‍🏫' },
  { icon: Heart, title: 'Parents', desc: 'Concierge hub & real-time progress', emoji: '👨🏾‍👩🏾‍👧🏾' },
  { icon: Building, title: 'Schools', desc: 'DIOS — full institutional OS', emoji: '🏫' },
  { icon: Landmark, title: 'Ministries', desc: 'Live national education telemetry', emoji: '🏛️' },
  { icon: Globe, title: 'NGOs', desc: 'Verified last-mile impact tracking', emoji: '🌍' },
  { icon: Rocket, title: 'Entrepreneurs', desc: 'Bounties, talent match & venture OS', emoji: '🚀' },
  { icon: Stethoscope, title: 'Healthcare', desc: 'CME, simulators, clinical research', emoji: '🩺' },
  { icon: Code2, title: 'Developers', desc: 'Cloud sandbox & national API workspace', emoji: '👩🏾‍💻' },
  { icon: Award, title: 'Vocational', desc: 'Skills certification & industry pathway', emoji: '🛠️' },
];

const synergy = [
  { step: '01', title: 'A student ships a project', desc: 'Built inside the Cloud IDE, graded by AI, stored on their Kinetic Ledger.' },
  { step: '02', title: 'A teacher adopts it', desc: 'Integrates the project into the national curriculum with one click.' },
  { step: '03', title: 'An NGO funds the scale-up', desc: 'Verified impact unlocks grant capital with on-platform smart agreements.' },
  { step: '04', title: 'An entrepreneur hires the builder', desc: 'Royalties, equity & contracts execute automatically. The loop compounds.' },
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
            <img src={eduMark} alt="Synapse EduZambia" className="w-9 h-9 rounded-xl shadow-card transition-transform group-hover:scale-105" />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-[15px] text-foreground tracking-tight">Synapse</span>
              <span className="text-[9px] text-muted-foreground font-semibold tracking-[0.18em] uppercase">EduZambia</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground font-medium">
            <a href="#pillars" className="hover:text-foreground transition-colors">Pillars</a>
            <a href="#synergy" className="hover:text-foreground transition-colors">Synergy Loop</a>
            <a href="#stakeholders" className="hover:text-foreground transition-colors">Stakeholders</a>
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
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/[0.08] blur-[150px]" />
          <div className="absolute bottom-[-100px] right-[-200px] w-[500px] h-[500px] rounded-full bg-accent/[0.06] blur-[120px]" />
          <div className="absolute top-[200px] left-[-200px] w-[400px] h-[400px] rounded-full bg-purple-500/[0.04] blur-[100px]" />
          {/* subtle grid */}
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="container mx-auto max-w-3xl text-center relative z-10">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-8 border border-primary/15 backdrop-blur-sm">
            <InfinityIcon className="w-3.5 h-3.5" />
            BrightSphere Technologies · The Synapse Initiative
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">2026</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-[2.25rem] leading-[1.02] sm:text-[3.75rem] md:text-[4.5rem] font-extrabold tracking-[-0.035em] mb-5">
            <span className="text-foreground">One nation.</span>
            <br />
            <span className="gradient-text">One infinite ecosystem.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-sm sm:text-[17px] text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Synapse EduZambia unifies learning, healthcare, enterprise & policy into a single multi-sided platform — engineered for Africa, built for humanity.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/auth?mode=signup')} className="w-full sm:w-auto h-13 px-8 text-[15px] font-semibold rounded-2xl shadow-xl shadow-primary/25 gap-2.5 hover:shadow-2xl hover:shadow-primary/30 transition-all">
              Join the Network
              <ArrowRight className="w-4.5 h-4.5" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleDemo} className="w-full sm:w-auto h-13 px-8 text-[15px] font-semibold rounded-2xl gap-2.5 border-border/40 hover:bg-secondary/80">
              <Play className="w-4 h-4 fill-current" />
              Live Demo
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground mt-10">
            {[
              { icon: WifiOff, text: 'Offline-first' },
              { icon: Shield, text: 'Zambian data sovereignty' },
              { icon: Database, text: 'Kinetic Ledger verified' },
              { icon: Check, text: 'ECZ aligned' },
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
              { n: '10', l: 'Stakeholder roles', icon: Network },
              { n: '50K+', l: 'Learners onboarding', icon: GraduationCap },
              { n: '150+', l: 'Partner schools', icon: Building },
              { n: '10', l: 'Provinces covered', icon: Globe },
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

      {/* Pillars */}
      <section id="pillars" className="py-16 sm:py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-[11px] font-semibold mb-5 border border-border/30">
              <Layers className="w-3 h-3 text-primary" /> The Six Pillars
            </div>
            <h2 className="text-2xl sm:text-[2.5rem] font-extrabold mb-3 tracking-tight leading-tight">
              An engine of <span className="text-primary">Connected Synthesis</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">Every pillar feeds every other. Individual progress automatically generates collective advancement.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pillars.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <div className="h-full p-5 rounded-2xl border border-border/20 bg-card/60 hover:bg-card hover:border-primary/20 hover:shadow-elevated transition-all duration-300 group cursor-default">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.tint} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
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

      {/* Universal Synergy Loop */}
      <section id="synergy" className="py-16 sm:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-5 border border-primary/15">
              <InfinityIcon className="w-3 h-3" /> The Universal Synergy Loop
            </div>
            <h2 className="text-2xl sm:text-[2.5rem] font-extrabold mb-3 tracking-tight leading-tight">
              Every action <span className="text-primary">compounds</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">A designed feedback architecture where one transaction ripples across the entire national network.</p>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
            <div className="grid gap-4 sm:gap-6">
              {synergy.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex ${i % 2 === 0 ? 'md:justify-start md:pr-[52%]' : 'md:justify-end md:pl-[52%]'}`}
                >
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/20 hover:border-primary/30 hover:shadow-elevated transition-all w-full max-w-md">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-extrabold text-xs flex items-center justify-center shadow-lg shadow-primary/20">
                      {s.step}
                    </div>
                    <div>
                      <h3 className="font-bold text-[15px] text-foreground mb-1">{s.title}</h3>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholders */}
      <section id="stakeholders" className="py-16 sm:py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-[2.5rem] font-extrabold mb-3 tracking-tight leading-tight">Ten portals. <span className="text-primary">One network.</span></h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">Each stakeholder gets a tailored experience — all feeding a shared national registry of human capability.</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {stakeholders.map((r, i) => (
              <motion.div key={r.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <div className="p-4 rounded-2xl bg-card border border-border/20 hover:border-primary/30 hover:shadow-elevated transition-all group h-full">
                  <div className="text-2xl mb-2.5 group-hover:scale-110 transition-transform inline-block">{r.emoji}</div>
                  <h3 className="font-bold text-[13px] text-foreground mb-0.5">{r.title}</h3>
                  <p className="text-[11px] text-muted-foreground leading-snug">{r.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Zambia 2030 impact */}
      <section className="py-16 sm:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-border/20 p-8 sm:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_60%)]" />
              <div className="relative grid sm:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold mb-4 uppercase tracking-wider">
                    Zambia 2030
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold mb-3 tracking-tight leading-tight">A national commitment to measurable impact</h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">BrightSphere's targets for the first national human-capital ecosystem in Africa.</p>
                  <div className="flex items-center gap-1 mb-4">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-sm font-semibold ml-2">Endorsed</span>
                    <span className="text-xs text-muted-foreground ml-1">by leading Zambian schools</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Verified learners', value: '2M+', icon: GraduationCap },
                    { label: 'Avg. grade lift', value: '+23%', icon: TrendingUp },
                    { label: 'Youth employment lift', value: '+31%', icon: Rocket },
                    { label: 'African gov\u2019ts licensed', value: '5+', icon: Globe },
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
              <InfinityIcon className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-[2.5rem] font-extrabold mb-3 tracking-tight leading-tight">The call to build<br />is now.</h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base max-w-md mx-auto">Join the founding network of students, teachers, ministries & makers shaping Zambia 2030.</p>
            <Button size="lg" onClick={() => navigate('/auth?mode=signup')} className="h-13 px-10 text-[15px] font-semibold rounded-2xl shadow-xl shadow-primary/25 gap-2.5">
              Enter the Network <ArrowRight className="w-4.5 h-4.5" />
            </Button>
            <p className="text-[11px] text-muted-foreground mt-6 font-medium">No credit card · Offline-capable · Zambian data sovereignty</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/10 py-8 px-4">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <img src={eduMark} alt="Synapse EduZambia" className="w-6 h-6 rounded-lg" />
            <span className="text-xs">© 2026 Synapse EduZambia · BrightSphere Technologies. Made with <Heart className="w-3 h-3 inline text-destructive fill-current" /> in Zambia</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <a href="mailto:hello@brightsphere.tech" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MVPLanding;
