import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, BookOpen, Calendar, Target, Sparkles, ArrowRight, FolderOpen, Trash2 } from 'lucide-react';

interface Course { id: string; name: string; subject: string | null; grade: string | null; emoji: string | null; color: string | null; exam_date: string | null; target_grade: string | null; }

const EMOJIS = ['📘','🧮','🧪','🧬','🔭','📐','💻','🩺','🎨','📚','🌍','⚗️'];
const COLORS = ['blue','purple','emerald','amber','rose','indigo','teal','orange'];
const colorMap: Record<string,string> = {
  blue: 'from-blue-500/15 to-blue-500/5 border-blue-500/20',
  purple: 'from-purple-500/15 to-purple-500/5 border-purple-500/20',
  emerald: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20',
  amber: 'from-amber-500/15 to-amber-500/5 border-amber-500/20',
  rose: 'from-rose-500/15 to-rose-500/5 border-rose-500/20',
  indigo: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/20',
  teal: 'from-teal-500/15 to-teal-500/5 border-teal-500/20',
  orange: 'from-orange-500/15 to-orange-500/5 border-orange-500/20',
};

const StudyDashboardPage = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', subject: '', grade: '', board: 'ECZ', objectives: '',
    target_grade: '', exam_date: '', daily_minutes: 30, level: 'Intermediate', learning_style: 'Visual',
    emoji: '📘', color: 'blue',
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('study_courses').select('*').order('updated_at', { ascending: false });
    setCourses((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  const create = async () => {
    if (!form.name.trim()) return toast.error('Course name required');
    setBusy(true);
    const { data, error } = await supabase.from('study_courses').insert({
      user_id: user!.id,
      name: form.name, subject: form.subject || null, grade: form.grade || null,
      board: form.board || null, objectives: form.objectives || null,
      target_grade: form.target_grade || null,
      exam_date: form.exam_date || null,
      daily_minutes: form.daily_minutes,
      level: form.level, learning_style: form.learning_style,
      emoji: form.emoji, color: form.color,
    } as any).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Course created');
    setOpen(false);
    nav(`/study/course/${(data as any).id}`);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this course and all its resources?')) return;
    await supabase.from('study_courses').delete().eq('id', id);
    load();
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="w-7 h-7 text-primary" /> Synapse Study</h1>
          <p className="text-muted-foreground text-sm">Every course is its own AI workspace — upload material, generate notes, quiz yourself, and chat with your tutor.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full gap-2"><Plus className="w-4 h-4" /> New course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create a course</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                    className={`w-10 h-10 rounded-xl text-lg border ${form.emoji===e?'bg-primary/10 border-primary':'border-border'}`}>{e}</button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`h-8 px-3 rounded-full text-xs border capitalize bg-gradient-to-br ${colorMap[c]} ${form.color===c?'ring-2 ring-primary':''}`}>{c}</button>
                ))}
              </div>
              <div><Label>Course name *</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Biology Grade 10" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Subject</Label><Input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Biology" /></div>
                <div><Label>Grade / Level</Label><Input value={form.grade} onChange={e=>setForm({...form,grade:e.target.value})} placeholder="Grade 10" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Board</Label><Input value={form.board} onChange={e=>setForm({...form,board:e.target.value})} placeholder="ECZ" /></div>
                <div><Label>Target grade</Label><Input value={form.target_grade} onChange={e=>setForm({...form,target_grade:e.target.value})} placeholder="A" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Exam date</Label><Input type="date" value={form.exam_date} onChange={e=>setForm({...form,exam_date:e.target.value})} /></div>
                <div><Label>Daily minutes</Label><Input type="number" value={form.daily_minutes} onChange={e=>setForm({...form,daily_minutes:parseInt(e.target.value)||30})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Level</Label>
                  <Select value={form.level} onValueChange={v=>setForm({...form,level:v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Beginner">Beginner</SelectItem><SelectItem value="Intermediate">Intermediate</SelectItem><SelectItem value="Advanced">Advanced</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Learning style</Label>
                  <Select value={form.learning_style} onValueChange={v=>setForm({...form,learning_style:v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Visual">Visual</SelectItem><SelectItem value="Reading">Reading</SelectItem><SelectItem value="Practice">Practice</SelectItem><SelectItem value="Audio">Audio</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Learning objectives</Label><Textarea value={form.objectives} onChange={e=>setForm({...form,objectives:e.target.value})} placeholder="What do you want to master?" rows={2} /></div>
            </div>
            <DialogFooter><Button onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create course'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading courses…</div>
      ) : courses.length === 0 ? (
        <Card className="p-10 text-center rounded-3xl border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3"><BookOpen className="w-8 h-8 text-primary" /></div>
          <h3 className="text-lg font-semibold">Create your first course</h3>
          <p className="text-sm text-muted-foreground mb-4">Turn any subject into a personal AI-powered study workspace.</p>
          <Button onClick={() => setOpen(true)} className="rounded-full"><Plus className="w-4 h-4 mr-1" /> New course</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c => (
            <Card key={c.id} className={`p-5 rounded-3xl border bg-gradient-to-br ${colorMap[c.color||'blue']} relative group cursor-pointer hover:shadow-lg transition`}
              onClick={() => nav(`/study/course/${c.id}`)}>
              <button onClick={(e)=>{e.stopPropagation();del(c.id);}} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-background/80 hover:bg-destructive/10 hover:text-destructive transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="text-3xl mb-3">{c.emoji}</div>
              <h3 className="font-semibold text-base truncate">{c.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {c.subject && <Badge variant="secondary" className="text-[10px]">{c.subject}</Badge>}
                {c.grade && <Badge variant="outline" className="text-[10px]">{c.grade}</Badge>}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {c.exam_date ? <><Calendar className="w-3 h-3" />{new Date(c.exam_date).toLocaleDateString()}</> : <><Target className="w-3 h-3" />{c.target_grade || 'No target'}</>}
                </span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyDashboardPage;
