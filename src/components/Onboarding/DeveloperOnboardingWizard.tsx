import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code2, Sparkles, Rocket, Github, ChevronRight, ChevronLeft, CheckCircle2, User } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const STACKS = ['JavaScript','TypeScript','React','Node.js','Python','Django','Flutter','Kotlin','Swift','Go','Rust','PHP','Laravel','Java','C#','.NET','SQL','Firebase','Supabase','AWS'];
const GOALS = [
  { id: 'portfolio', label: 'Build a portfolio' },
  { id: 'freelance', label: 'Freelance & earn' },
  { id: 'job',       label: 'Land a dev job' },
  { id: 'startup',   label: 'Ship my own startup' },
  { id: 'opensource',label: 'Contribute to open source' },
];

const STEPS = [
  { id: 'personal', icon: User,    title: 'About You' },
  { id: 'stack',    icon: Code2,   title: 'Your Stack' },
  { id: 'goals',    icon: Rocket,  title: 'Goals' },
  { id: 'done',     icon: Sparkles,title: 'Done' },
];

interface Props { onComplete: () => void }

export const DeveloperOnboardingWizard: React.FC<Props> = ({ onComplete }) => {
  const { profile, updateProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [level, setLevel] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [github, setGithub] = useState('');

  const [stack, setStack] = useState<string[]>([]);
  const [customStack, setCustomStack] = useState('');

  const [goals, setGoals] = useState<string[]>([]);
  const [careerInterest, setCareerInterest] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setYearsExperience(profile.years_experience ? String(profile.years_experience) : '');
      setStack(profile.subjects || []);
      setCareerInterest(profile.career_interest || '');
    }
  }, [profile?.id]);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const addCustom = () => {
    const v = customStack.trim();
    if (!v || stack.includes(v)) return;
    setStack([...stack, v]);
    setCustomStack('');
  };

  const handleNext = async () => {
    if (step === 0 && !fullName.trim()) { toast({ title: 'Full name required', variant: 'destructive' }); return; }
    if (step === 1 && stack.length === 0) { toast({ title: 'Pick at least one technology', variant: 'destructive' }); return; }
    if (step === 2) {
      setSaving(true);
      const result = await updateProfile({
        full_name: fullName, bio: bio || null,
        years_experience: yearsExperience ? parseInt(yearsExperience) : null,
        subjects: stack,
        career_interest: careerInterest || goals[0] || null,
        study_goals: goals.join(', ') || null,
      });
      setSaving(false);
      if (!result.success) { toast({ title: 'Save failed', variant: 'destructive' }); return; }
      toast({ title: 'Welcome, Developer! 🚀' });
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Developer Setup</h1>
        <p className="text-muted-foreground">Get your workspace tuned for shipping</p>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex-1 flex items-center gap-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
              i < step ? 'bg-primary text-primary-foreground' :
              i === step ? 'bg-primary/20 text-primary border-2 border-primary' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-1 rounded ${i < step ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <Card>
            <CardContent className="p-6 md:p-8 space-y-6">
              {step === 0 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <User className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">About You</h2>
                  </div>
                  <div className="grid gap-4 max-w-md mx-auto">
                    <div><Label>Full Name *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g., Chanda Banda" /></div>
                    <div>
                      <Label>Experience Level</Label>
                      <Select value={level} onValueChange={setLevel}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Years coding</Label><Input type="number" min="0" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} placeholder="0" /></div>
                    <div><Label className="flex items-center gap-2"><Github className="w-4 h-4" /> GitHub (optional)</Label><Input value={github} onChange={e => setGithub(e.target.value)} placeholder="github.com/your-handle" /></div>
                    <div><Label>Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="What do you like to build?" rows={3} /></div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <Code2 className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">Your Stack</h2>
                    <p className="text-sm text-muted-foreground">Pick the tools you use or want to learn</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                    {STACKS.map(s => (
                      <Badge key={s} variant={stack.includes(s) ? 'default' : 'outline'}
                        className="cursor-pointer text-sm py-1.5 px-3"
                        onClick={() => toggle(stack, s, setStack)}>
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input value={customStack} onChange={e => setCustomStack(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())} placeholder="Add another…" />
                    <Button variant="outline" onClick={addCustom}>Add</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <Rocket className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">What's your goal?</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                    {GOALS.map(g => (
                      <button key={g.id} onClick={() => toggle(goals, g.id, setGoals)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          goals.includes(g.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                        }`}>
                        <div className="font-medium">{g.label}</div>
                      </button>
                    ))}
                  </div>
                  <div className="max-w-md mx-auto">
                    <Label>Dream role (optional)</Label>
                    <Input value={careerInterest} onChange={e => setCareerInterest(e.target.value)} placeholder="e.g., Full-stack engineer" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="text-center space-y-6 py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <Sparkles className="w-20 h-20 text-primary mx-auto" />
                  </motion.div>
                  <h2 className="text-3xl font-bold">You're in 🚀</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">Your Developer workspace is ready — start a project, get AI code reviews, and ship.</p>
                  <Button size="lg" className="text-lg h-14 px-8" onClick={onComplete}>
                    Open Developer Workspace <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}

              {step < 3 && (
                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleNext} disabled={saving}>
                    {step === 2 ? (saving ? 'Saving…' : 'Finish') : 'Next'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DeveloperOnboardingWizard;
