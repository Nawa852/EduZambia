import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, BookOpen, Users, School, Building2,
  Stethoscope, Rocket, Code, Wrench, Shield, CheckCircle2, ArrowRight, ArrowLeft, Sparkles
} from 'lucide-react';
import synapseLogo from '@/assets/synapse-logo.png';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roles: { value: AppRole; label: string; icon: React.ElementType; description: string; color: string; home: string; goals: string[]; comingSoon?: boolean }[] = [
  { value: 'student', label: 'Student', icon: GraduationCap, description: 'Learn with AI tutors & ECZ resources', color: 'from-blue-500 to-indigo-600', home: '/dashboard', goals: ['Pass ECZ exams', 'Daily AI tutoring', 'Catch up on subjects', 'Just exploring'] },
  { value: 'teacher', label: 'Teacher', icon: BookOpen, description: 'Create courses & manage students', color: 'from-emerald-500 to-teal-600', home: '/teacher', goals: ['Plan ECZ lessons with AI', 'Grade faster', 'Track my classes', 'Engage parents'] },
  { value: 'guardian', label: 'Parent / Guardian', icon: Users, description: "Track your child's progress", color: 'from-orange-500 to-amber-600', home: '/family', goals: ["Monitor my child's progress", 'Talk to teachers', 'Limit screen time', 'Help with homework'] },
  { value: 'doctor', label: 'Medical Student', icon: Stethoscope, description: 'Clinical cases & rotations', color: 'from-rose-500 to-pink-600', home: '/medical', goals: ['Clinical case practice', 'Drug reference', 'Track rotations', 'Exam prep'], comingSoon: true },
  { value: 'entrepreneur', label: 'Entrepreneur', icon: Rocket, description: 'Business tools & venture tracking', color: 'from-purple-500 to-violet-600', home: '/entrepreneur', goals: ['Build a business plan', 'Find funding', 'Market research', 'Pitch deck'], comingSoon: true },
  { value: 'developer', label: 'Developer', icon: Code, description: 'Code challenges & project builder', color: 'from-cyan-500 to-blue-600', home: '/developer', goals: ['Practice coding', 'AI code review', 'Build a portfolio', 'Hackathons'], comingSoon: true },
  { value: 'skills', label: 'Skills Training', icon: Wrench, description: 'Vocational & trade skills', color: 'from-yellow-500 to-orange-600', home: '/dashboard', goals: ['Learn a trade', 'Get certified', 'Find work', 'Upskill'], comingSoon: true },
  { value: 'cybersecurity', label: 'Cybersecurity', icon: Shield, description: 'Ethical hacking & CTF labs', color: 'from-red-500 to-rose-600', home: '/cybersecurity', goals: ['CTF challenges', 'SOC simulator', 'Skill tree', 'Career prep'], comingSoon: true },
  { value: 'institution', label: 'School Admin', icon: School, description: 'Manage your institution', color: 'from-slate-500 to-gray-600', home: '/admin', goals: ['Manage students', 'Track teachers', 'School analytics', 'Communications'], comingSoon: true },
  { value: 'ministry', label: 'Ministry / NGO', icon: Building2, description: 'Oversee education programs', color: 'from-green-500 to-emerald-600', home: '/ministry', goals: ['Policy tracking', 'School registry', 'Interventions', 'Donor impact'], comingSoon: true },
];

const ChooseRolePage = () => {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selected, setSelected] = useState<AppRole>('student');
  const [goal, setGoal] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) navigate('/auth', { replace: true });
    else if (user.user_metadata?.full_name) setDisplayName(user.user_metadata.full_name);
  }, [user, navigate]);

  const activeRole = roles.find(r => r.value === selected)!;

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: selected,
          full_name: displayName || user.user_metadata?.full_name || null,
          study_goals: goal || null,
          preferred_language: localStorage.getItem('synapse-lang') || 'English',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;

      localStorage.setItem('edu-zambia-user-type', selected);
      if (goal) localStorage.setItem('synapse-primary-goal', goal);
      localStorage.removeItem('edu-zambia-needs-role');
      localStorage.setItem('edu-zambia-show-tour', 'true');

      toast({ title: `Welcome to Synapse${displayName ? `, ${displayName.split(' ')[0]}` : ''}!`, description: `Heading to your ${activeRole.label} workspace.` });
      navigate(activeRole.home, { replace: true });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl">
        <div className="flex flex-col items-center mb-6">
          <img src={synapseLogo} alt="Synapse Edu Zambia" className="w-20 h-20 rounded-2xl shadow-xl mb-3" />
          <p className="text-xs font-semibold tracking-widest text-muted-foreground">LEARN · CONNECT · GROW</p>
        </div>

        <Card className="border-0 shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-muted">
            <motion.div className="h-full bg-gradient-to-r from-primary to-accent" animate={{ width: `${((step + 1) / 3) * 100}%` }} />
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">How will you use Synapse?</CardTitle>
                  <CardDescription>Pick the role that fits you best — we'll tailor everything around it.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {roles.map((role, i) => (
                      <motion.button
                        key={role.value}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        type="button"
                        disabled={role.comingSoon}
                        onClick={() => !role.comingSoon && setSelected(role.value)}
                        className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          role.comingSoon
                            ? 'border-border opacity-60 cursor-not-allowed'
                            : selected === role.value
                            ? 'border-primary bg-primary/5 shadow-md scale-[1.01]'
                            : 'border-border hover:border-primary/40 hover:bg-accent/30'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center shrink-0`}>
                          <role.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{role.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{role.description}</p>
                        </div>
                        {role.comingSoon ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full shrink-0">Soon</span>
                        ) : selected === role.value ? (
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        ) : null}
                      </motion.button>
                    ))}
                  </div>
                  <Button onClick={() => setStep(1)} className="w-full" size="lg">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${activeRole.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <activeRole.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold">What's your #1 goal?</CardTitle>
                  <CardDescription>As a {activeRole.label.toLowerCase()}, what do you want from Synapse first?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {activeRole.goals.map((g, i) => (
                      <motion.button
                        key={g}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        type="button"
                        onClick={() => setGoal(g)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          goal === g
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/40 hover:bg-accent/30'
                        }`}
                      >
                        <Sparkles className={`w-4 h-4 shrink-0 ${goal === g ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium text-sm">{g}</span>
                        {goal === g && <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />}
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button onClick={() => setStep(2)} className="flex-1" size="lg" disabled={!goal}>
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">What should we call you?</CardTitle>
                  <CardDescription>One more thing before your personalized workspace opens.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Your name</Label>
                    <Input id="displayName" placeholder="e.g. Mwape Banda" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-1">
                    <p><span className="text-muted-foreground">Role:</span> <span className="font-semibold">{activeRole.label}</span></p>
                    <p><span className="text-muted-foreground">Goal:</span> <span className="font-semibold">{goal}</span></p>
                    <p><span className="text-muted-foreground">You'll land in:</span> <span className="font-semibold">{activeRole.home}</span></p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button onClick={handleFinish} className="flex-1" size="lg" disabled={loading}>
                      {loading ? 'Setting up…' : <>Enter Synapse <ArrowRight className="w-4 h-4 ml-2" /></>}
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};

export default ChooseRolePage;
