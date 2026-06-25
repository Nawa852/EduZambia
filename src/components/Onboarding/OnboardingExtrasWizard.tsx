import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload, Youtube, Calendar as CalIcon, ShieldCheck, Sparkles, CheckCircle2,
  ChevronLeft, ChevronRight, X, Plus, FileText,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const POPULAR_CHANNELS = [
  { label: 'Khan Academy', url: 'https://www.youtube.com/@khanacademy' },
  { label: 'CrashCourse', url: 'https://www.youtube.com/@crashcourse' },
  { label: 'ECZ Past Papers ZM', url: 'https://www.youtube.com/results?search_query=ECZ+past+papers' },
  { label: 'TED-Ed', url: 'https://www.youtube.com/@TEDEd' },
];

const STEPS = [
  { id: 'materials',  icon: Upload,      title: 'Materials' },
  { id: 'youtube',    icon: Youtube,     title: 'YouTube' },
  { id: 'timetable',  icon: CalIcon,     title: 'Timetable' },
  { id: 'guardian',   icon: ShieldCheck, title: 'Guardian' },
  { id: 'done',       icon: Sparkles,    title: 'Done' },
];

type TimetableRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  location?: string;
  is_block_apps: boolean;
};

export const OnboardingExtrasWizard: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { profile, updateProfile, refresh } = useProfile() as any;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Materials
  const [files, setFiles] = useState<File[]>([]);
  const [materialCategory, setMaterialCategory] = useState<string>('notes');

  // YouTube channels
  const [channelInput, setChannelInput] = useState('');
  const [channels, setChannels] = useState<{ url: string; name?: string }[]>([]);

  // Timetable
  const [rows, setRows] = useState<TimetableRow[]>([
    { day_of_week: 1, start_time: '17:00', end_time: '18:30', subject: 'Mathematics', is_block_apps: true },
  ]);

  // Guardian + app-block
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('Parent');
  const [appBlockConsent, setAppBlockConsent] = useState(true);

  useEffect(() => {
    if (profile?.guardian_details) {
      const g = profile.guardian_details as any;
      setGuardianName(g?.name || '');
      setGuardianPhone(g?.phone || profile?.guardian_contact || '');
      setGuardianEmail(g?.email || '');
      setGuardianRelation(g?.relation || 'Parent');
      setAppBlockConsent(Boolean(profile?.app_block_consent));
    }
  }, [profile?.id]);

  const addChannel = () => {
    const v = channelInput.trim();
    if (!v) return;
    if (!/youtube\.com|youtu\.be/i.test(v)) {
      toast({ title: 'Enter a valid YouTube URL', variant: 'destructive' });
      return;
    }
    setChannels(prev => [...prev, { url: v }]);
    setChannelInput('');
  };

  const addRow = () => setRows(r => [...r, { day_of_week: 1, start_time: '18:00', end_time: '19:00', subject: '', is_block_apps: true }]);
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<TimetableRow>) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, ...patch } : row));

  const uploadMaterials = async () => {
    if (!profile?.id || files.length === 0) return;
    const inserts: any[] = [];
    for (const f of files) {
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${profile.id}/materials/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, f, { upsert: false });
      if (upErr) { console.warn('upload failed', upErr); continue; }
      inserts.push({
        user_id: profile.id,
        title: f.name,
        file_path: path,
        file_type: f.type || null,
        file_size_bytes: f.size,
        category: materialCategory,
        subject: null,
        grade: profile?.grade || null,
      });
    }
    if (inserts.length > 0) {
      await supabase.from('user_materials').insert(inserts);
    }
  };

  const saveChannels = async () => {
    if (!profile?.id || channels.length === 0) return;
    const rows = channels.map(c => ({
      user_id: profile.id,
      channel_url: c.url,
      channel_name: c.name || null,
      kind: /playlist\?list=/i.test(c.url) ? 'playlist' : 'channel',
    }));
    await supabase.from('user_youtube_channels').insert(rows);
  };

  const saveTimetable = async () => {
    if (!profile?.id || rows.length === 0) return;
    const inserts = rows
      .filter(r => r.subject.trim())
      .map(r => ({ ...r, user_id: profile.id, location: r.location || null }));
    if (inserts.length > 0) await supabase.from('user_timetables').insert(inserts);
  };

  const finalize = async () => {
    setSaving(true);
    try {
      await uploadMaterials();
      await saveChannels();
      await saveTimetable();
      await updateProfile({
        guardian_contact: guardianPhone || null,
        guardian_details: {
          name: guardianName || null,
          phone: guardianPhone || null,
          email: guardianEmail || null,
          relation: guardianRelation,
        },
        app_block_consent: appBlockConsent,
        onboarding_extras_complete: true,
      });
      if (typeof refresh === 'function') await refresh();
      toast({ title: 'All set! 🎉', description: 'Your study setup is saved.' });
      setStep(STEPS.length - 1);
    } catch (e: any) {
      toast({ title: 'Something went wrong', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const finishAndExit = () => {
    if (onComplete) onComplete();
    else navigate('/dashboard');
  };

  const next = async () => {
    if (step === 3) { await finalize(); return; }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-8">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Finish your study setup</h1>
          <p className="text-sm text-muted-foreground">Materials, YouTube, timetable and guardian — under 2 minutes.</p>
        </div>

        {/* Stepper */}
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
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 rounded ${i < step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="p-6 md:p-8 space-y-5">
                {/* STEP 0 — Materials */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <Upload className="w-10 h-10 text-primary mx-auto" />
                      <h2 className="text-xl font-bold">Upload your academic materials</h2>
                      <p className="text-sm text-muted-foreground">
                        Notes, past papers, results — we keep them safe and use them to personalise your AI tutor.
                      </p>
                    </div>

                    <div>
                      <Label>Category</Label>
                      <Select value={materialCategory} onValueChange={setMaterialCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notes">Class notes</SelectItem>
                          <SelectItem value="past_paper">Past papers</SelectItem>
                          <SelectItem value="textbook">Textbook</SelectItem>
                          <SelectItem value="results">Past results / report card</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <label className="block">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                        onChange={e => setFiles(Array.from(e.target.files || []))}
                        className="hidden"
                      />
                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium mt-2">Tap to choose files</p>
                        <p className="text-xs text-muted-foreground">PDFs, images, docs — up to a few MB each</p>
                      </div>
                    </label>
                    {files.length > 0 && (
                      <div className="space-y-1.5">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm bg-muted/40 rounded-lg px-3 py-2">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span className="flex-1 truncate">{f.name}</span>
                            <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">You can always add more later from your profile.</p>
                  </div>
                )}

                {/* STEP 1 — YouTube */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <Youtube className="w-10 h-10 text-red-500 mx-auto" />
                      <h2 className="text-xl font-bold">Sync your favourite YouTube channels</h2>
                      <p className="text-sm text-muted-foreground">
                        We'll surface videos from these channels in your Learning Hub.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={channelInput}
                        onChange={e => setChannelInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addChannel())}
                        placeholder="https://www.youtube.com/@yourchannel"
                      />
                      <Button type="button" onClick={addChannel}><Plus className="w-4 h-4" /></Button>
                    </div>

                    {channels.length > 0 && (
                      <div className="space-y-1.5">
                        {channels.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm bg-muted/40 rounded-lg px-3 py-2">
                            <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="flex-1 truncate">{c.url}</span>
                            <button onClick={() => setChannels(channels.filter((_, idx) => idx !== i))}>
                              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Popular picks</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {POPULAR_CHANNELS.map(c => (
                          <button
                            key={c.url}
                            type="button"
                            onClick={() => setChannels(prev => [...prev, { url: c.url, name: c.label }])}
                            className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary text-xs font-medium transition"
                          >
                            + {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 — Timetable */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <CalIcon className="w-10 h-10 text-primary mx-auto" />
                      <h2 className="text-xl font-bold">Set your weekly timetable</h2>
                      <p className="text-sm text-muted-foreground">Block out study time. We can mute games/socials during these slots.</p>
                    </div>

                    <div className="space-y-2">
                      {rows.map((r, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border/40 bg-card space-y-2">
                          <div className="grid grid-cols-12 gap-2">
                            <Select value={String(r.day_of_week)} onValueChange={v => updateRow(i, { day_of_week: parseInt(v) })}>
                              <SelectTrigger className="col-span-4 h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>{DAYS.map((d, idx) => <SelectItem key={d} value={String(idx)}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                            <Input type="time" className="col-span-4 h-9" value={r.start_time} onChange={e => updateRow(i, { start_time: e.target.value })} />
                            <Input type="time" className="col-span-4 h-9" value={r.end_time} onChange={e => updateRow(i, { end_time: e.target.value })} />
                          </div>
                          <Input placeholder="Subject (e.g. Mathematics)" value={r.subject} onChange={e => updateRow(i, { subject: e.target.value })} className="h-9" />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Switch checked={r.is_block_apps} onCheckedChange={v => updateRow(i, { is_block_apps: v })} />
                              Block distracting apps
                            </label>
                            <button onClick={() => removeRow(i)} className="text-xs text-destructive hover:underline">Remove</button>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addRow} className="w-full">
                        <Plus className="w-4 h-4 mr-1.5" /> Add slot
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3 — Guardian + consent */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
                      <h2 className="text-xl font-bold">Guardian & permissions</h2>
                      <p className="text-sm text-muted-foreground">Required for under-18 learners and for app-blocking.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label>Guardian full name</Label>
                        <Input value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="e.g. Mwila Chanda" />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} placeholder="+260..." />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} placeholder="parent@email.com" />
                      </div>
                      <div className="col-span-2">
                        <Label>Relation</Label>
                        <Select value={guardianRelation} onValueChange={setGuardianRelation}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Parent">Parent</SelectItem>
                            <SelectItem value="Guardian">Guardian</SelectItem>
                            <SelectItem value="Sibling">Sibling</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-primary/5">
                      <Switch checked={appBlockConsent} onCheckedChange={setAppBlockConsent} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Allow study-time app blocking</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          During timetable slots marked "block apps", Edu Zambia will mute notifications and remind you to stay focused. You can revoke this anytime.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 — Done */}
                {step === 4 && (
                  <div className="text-center space-y-5 py-2">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                      <Sparkles className="w-16 h-16 text-primary mx-auto" />
                    </motion.div>
                    <h2 className="text-2xl font-bold">You're fully set up! 🎉</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Your materials, channels, timetable and guardian info are saved. Time to start learning.
                    </p>
                    <Button size="lg" className="h-12 px-6" onClick={finishAndExit}>
                      Go to dashboard <ChevronRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                )}

                {/* Nav */}
                {step < 4 && (
                  <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" onClick={back} disabled={step === 0}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <div className="flex items-center gap-2">
                      {step < 3 && (
                        <Button variant="ghost" size="sm" onClick={() => setStep(s => Math.min(s + 1, 3))}>
                          Skip
                        </Button>
                      )}
                      <Button onClick={next} disabled={saving}>
                        {step === 3 ? (saving ? 'Saving...' : 'Finish') : 'Next'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingExtrasWizard;
