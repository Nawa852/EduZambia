import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, User, Target, Sparkles, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

const TRADES = [
  'Carpentry','Plumbing','Electrical Installation','Welding & Metal Fabrication','Auto Mechanics',
  'Tailoring & Fashion','Hairdressing & Beauty','Catering & Hospitality','Bricklaying','Solar Installation',
  'Agriculture','Poultry Farming','Computer Repair','Refrigeration & Air-Con','Graphic Design',
  'Videography & Photography','Baking & Confectionery','Driving (PSV/HGV)','Beekeeping','Fish Farming',
];
const LEVELS = ['Just starting','Some experience','Skilled','Certified','Master'];
const PROVINCES = ['Central','Copperbelt','Eastern','Luapula','Lusaka','Muchinga','Northern','North-Western','Southern','Western'];
const GOALS = [
  { id: 'certify',  label: 'Get certified' },
  { id: 'job',      label: 'Find a job or apprenticeship' },
  { id: 'business', label: 'Start my own business' },
  { id: 'improve',  label: 'Sharpen my current skill' },
];

const STEPS = [
  { id: 'personal', icon: User,    title: 'About You' },
  { id: 'trades',   icon: Wrench,  title: 'Your Trades' },
  { id: 'goals',    icon: Target,  title: 'Goals' },
  { id: 'done',     icon: Sparkles,title: 'Done' },
];

interface Props { onComplete: () => void }

export const VocationalOnboardingWizard: React.FC<Props> = ({ onComplete }) => {
  const { profile, updateProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [level, setLevel] = useState('');

  const [trades, setTrades] = useState<string[]>([]);
  const [customTrade, setCustomTrade] = useState('');
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setProvince(profile.province || '');
      setTrades(profile.subjects || []);
    }
  }, [profile?.id]);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const addCustom = () => {
    const v = customTrade.trim();
    if (!v || trades.includes(v)) return;
    setTrades([...trades, v]); setCustomTrade('');
  };

  const handleNext = async () => {
    if (step === 0 && !fullName.trim()) { toast({ title: 'Full name required', variant: 'destructive' }); return; }
    if (step === 1 && trades.length === 0) { toast({ title: 'Pick at least one trade', variant: 'destructive' }); return; }
    if (step === 2) {
      setSaving(true);
      const result = await updateProfile({
        full_name: fullName, phone: phone || null, province: province || null,
        subjects: trades,
        education_level: level || null,
        study_goals: goals.join(', ') || null,
      });
      setSaving(false);
      if (!result.success) { toast({ title: 'Save failed', variant: 'destructive' }); return; }
      toast({ title: 'Skill profile ready! 🛠️' });
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Skills & Trades Setup</h1>
        <p className="text-muted-foreground">Learn a trade. Earn a living.</p>
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
                    <div>
                      <Label>Current level</Label>
                      <Select value={level} onValueChange={setLevel}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <Wrench className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">Which trades?</h2>
                    <p className="text-sm text-muted-foreground">Pick what you do or want to learn</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                    {TRADES.map(t => (
                      <Badge key={t} variant={trades.includes(t) ? 'default' : 'outline'}
                        className="cursor-pointer text-sm py-1.5 px-3"
                        onClick={() => toggle(trades, t, setTrades)}>
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input value={customTrade} onChange={e => setCustomTrade(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())} placeholder="Add another…" />
                    <Button variant="outline" onClick={addCustom}>Add</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <Target className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">What do you want?</h2>
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
                  <h2 className="text-3xl font-bold">Ready to learn 🛠️</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">Video lessons, apprenticeships, and certification paths are lined up for you.</p>
                  <Button size="lg" className="text-lg h-14 px-8" onClick={onComplete}>
                    Open Skills Hub <ChevronRight className="w-5 h-5 ml-2" />
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

export default VocationalOnboardingWizard;
