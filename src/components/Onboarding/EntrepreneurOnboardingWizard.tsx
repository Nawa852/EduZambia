import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Rocket, User, Briefcase, Target, Sparkles, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

const STAGES = [
  { id: 'idea',      label: 'Just an idea' },
  { id: 'planning',  label: 'Planning & research' },
  { id: 'mvp',       label: 'Building MVP' },
  { id: 'launched',  label: 'Launched, finding customers' },
  { id: 'scaling',   label: 'Growing & scaling' },
];
const SECTORS = [
  'Agriculture','FinTech','EdTech','HealthTech','E-commerce','Retail','Manufacturing','Tourism',
  'Fashion','Food & Beverage','Renewable Energy','Logistics','Construction','Media & Content','Mining','Real Estate',
];
const GOALS = [
  { id: 'plan',    label: 'Write my business plan' },
  { id: 'funding', label: 'Raise funding / grants' },
  { id: 'launch',  label: 'Launch my product' },
  { id: 'grow',    label: 'Grow revenue' },
  { id: 'mentor',  label: 'Find a mentor' },
  { id: 'network', label: 'Meet other founders' },
];
const PROVINCES = ['Central','Copperbelt','Eastern','Luapula','Lusaka','Muchinga','Northern','North-Western','Southern','Western'];

const STEPS = [
  { id: 'personal', icon: User,      title: 'About You' },
  { id: 'venture',  icon: Briefcase, title: 'Venture' },
  { id: 'goals',    icon: Target,    title: 'Goals' },
  { id: 'done',     icon: Sparkles,  title: 'Done' },
];

interface Props { onComplete: () => void }

export const EntrepreneurOnboardingWizard: React.FC<Props> = ({ onComplete }) => {
  const { profile, updateProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [bio, setBio] = useState('');

  const [ventureName, setVentureName] = useState('');
  const [stage, setStage] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [pitch, setPitch] = useState('');

  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setProvince(profile.province || '');
      setBio(profile.bio || '');
      setSectors(profile.subjects || []);
    }
  }, [profile?.id]);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const handleNext = async () => {
    if (step === 0 && !fullName.trim()) { toast({ title: 'Full name required', variant: 'destructive' }); return; }
    if (step === 1 && !stage) { toast({ title: 'Pick a stage', variant: 'destructive' }); return; }
    if (step === 2) {
      setSaving(true);
      const result = await updateProfile({
        full_name: fullName, phone: phone || null, province: province || null,
        bio: bio || null,
        institution_name: ventureName || null,
        subjects: sectors,
        career_interest: stage,
        study_goals: [pitch, ...goals].filter(Boolean).join(' | ') || null,
      });
      setSaving(false);
      if (!result.success) { toast({ title: 'Save failed', variant: 'destructive' }); return; }
      toast({ title: 'Founder profile ready! 🚀' });
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Entrepreneur Setup</h1>
        <p className="text-muted-foreground">Turn your idea into a business</p>
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
                    <div><Label>Full Name *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
                    <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+260..." /></div>
                    <div>
                      <Label>Province</Label>
                      <Select value={province} onValueChange={setProvince}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Short bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="What's your background?" /></div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <Briefcase className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">Your Venture</h2>
                  </div>
                  <div className="grid gap-4 max-w-md mx-auto">
                    <div><Label>Venture name (or working title)</Label><Input value={ventureName} onChange={e => setVentureName(e.target.value)} placeholder="e.g., Lusaka Fresh Farms" /></div>
                    <div>
                      <Label>Stage *</Label>
                      <div className="grid gap-2 mt-1">
                        {STAGES.map(s => (
                          <button key={s.id} onClick={() => setStage(s.id)}
                            className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                              stage === s.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                            }`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Sectors</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {SECTORS.map(s => (
                          <Badge key={s} variant={sectors.includes(s) ? 'default' : 'outline'}
                            className="cursor-pointer text-xs py-1 px-2"
                            onClick={() => toggle(sectors, s, setSectors)}>
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div><Label>Pitch (one sentence)</Label><Textarea value={pitch} onChange={e => setPitch(e.target.value)} rows={2} placeholder="We help ___ do ___ by ___" /></div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <Target className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">What do you need first?</h2>
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
                </div>
              )}

              {step === 3 && (
                <div className="text-center space-y-6 py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <Sparkles className="w-20 h-20 text-primary mx-auto" />
                  </motion.div>
                  <h2 className="text-3xl font-bold">Let's build 🚀</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">AI business plan, funding tracker, and mentor network are set up for your venture.</p>
                  <Button size="lg" className="text-lg h-14 px-8" onClick={onComplete}>
                    Open Founder Workspace <ChevronRight className="w-5 h-5 ml-2" />
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

export default EntrepreneurOnboardingWizard;
