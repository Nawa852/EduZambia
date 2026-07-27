import { useState, useEffect, useMemo } from 'react';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Calendar, Plus, Clock, BookOpen, CheckCircle, Trash2,
  ChevronLeft, ChevronRight, Target, Flame, Sparkles
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';

interface StudySession {
  id: string;
  title: string;
  subject: string;
  date: string;
  duration_minutes: number;
  completed: boolean;
}

// We'll use study_goals table with goal_type='session' to store planned study sessions
const StudyPlannerPage = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('mathematics');
  const [newDuration, setNewDuration] = useState('30');

  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), 
    [weekStart]
  );

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('study_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });
    if (data) setGoals(data);
    setLoading(false);
  };

  const createSession = async () => {
    if (!user || !newTitle.trim() || !selectedDate) return;
    const { data, error } = await supabase.from('study_goals').insert({
      user_id: user.id,
      title: `${newTitle.trim()} (${newSubject})`,
      goal_type: 'session',
      target: parseInt(newDuration) || 30,
      current: 0,
      due_date: format(selectedDate, 'yyyy-MM-dd'),
      completed: false,
    }).select().single();

    if (error) toast.error('Failed to create session');
    else if (data) {
      setGoals(prev => [...prev, data]);
      toast.success('Study session planned!');
      setCreateOpen(false);
      setNewTitle(''); setNewSubject('mathematics'); setNewDuration('30');
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    const { error } = await supabase.from('study_goals').update({
      completed: !completed,
      completed_at: !completed ? new Date().toISOString() : null,
      current: !completed ? goals.find(g => g.id === id)?.target || 0 : 0,
    }).eq('id', id);
    if (!error) {
      setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !completed, current: !completed ? g.target : 0 } : g));
      toast.success(!completed ? 'Session completed! 🎉' : 'Marked as incomplete');
    }
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('study_goals').delete().eq('id', id);
    if (!error) {
      setGoals(prev => prev.filter(g => g.id !== id));
      toast.success('Session removed');
    }
  };

  const getSessionsForDate = (date: Date) => 
    goals.filter(g => g.goal_type === 'session' && g.due_date && isSameDay(new Date(g.due_date), date));

  const weekSessions = weekDays.reduce((acc, day) => acc + getSessionsForDate(day).length, 0);
  const weekCompleted = weekDays.reduce((acc, day) => acc + getSessionsForDate(day).filter(s => s.completed).length, 0);

  const subjects = [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'english', label: 'English' },
    { value: 'social_studies', label: 'Social Studies' },
    { value: 'biology', label: 'Biology' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'physics', label: 'Physics' },
    { value: 'civic_education', label: 'Civic Education' },
    { value: 'computer_studies', label: 'Computer Studies' },
    { value: 'other', label: 'Other' },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4">
        <LogoLoader text="Loading planner..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> Study Planner
          </h1>
          <p className="text-sm text-muted-foreground">Plan and track your study sessions</p>
        </div>
        <Button onClick={() => { setSelectedDate(new Date()); setCreateOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Plan Session
        </Button>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Target className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{weekSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions this week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{weekCompleted}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><Flame className="w-5 h-5 text-amber-500" /></div>
            <div>
              <Progress value={weekSessions > 0 ? (weekCompleted / weekSessions) * 100 : 0} className="h-2 w-24" />
              <p className="text-xs text-muted-foreground mt-1">{weekSessions > 0 ? Math.round((weekCompleted / weekSessions) * 100) : 0}% completion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(prev => subWeeks(prev, 1))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="font-semibold text-foreground">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(prev => addWeeks(prev, 1))}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {weekDays.map(day => {
          const sessions = getSessionsForDate(day);
          const today = isToday(day);
          return (
            <Card
              key={day.toISOString()}
              className={`min-h-[160px] cursor-pointer transition-all hover:shadow-md ${today ? 'ring-2 ring-primary' : ''}`}
              onClick={() => { setSelectedDate(day); setCreateOpen(true); }}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${today ? 'text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-lg font-bold ${today ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {sessions.map(s => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`p-1.5 rounded text-xs cursor-pointer ${
                          s.completed
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 line-through'
                            : 'bg-primary/10 text-primary'
                        }`}
                        onClick={(e) => { e.stopPropagation(); toggleComplete(s.id, s.completed); }}
                      >
                        <p className="font-medium truncate">{s.title.replace(/ \(.*\)$/, '')}</p>
                        <p className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />{s.target}m
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {sessions.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 text-center mt-6">
                      <Plus className="w-3 h-3 mx-auto mb-1" />tap to add
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Today's Sessions Detail */}
      {getSessionsForDate(new Date()).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Today's Study Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {getSessionsForDate(new Date()).map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleComplete(s.id, s.completed)} className="shrink-0">
                    {s.completed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </button>
                  <div>
                    <p className={`font-medium text-foreground ${s.completed ? 'line-through opacity-60' : ''}`}>{s.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{s.target} minutes</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteSession(s.id)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Session Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Plan Study Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
            </p>
            <div>
              <Label>What will you study?</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Chapter 5 Review" />
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={newSubject} onValueChange={setNewSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} min="5" max="240" />
            </div>
            <Button className="w-full" onClick={createSession} disabled={!newTitle.trim()}>
              <Plus className="w-4 h-4 mr-2" /> Add Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyPlannerPage;
