import { useState, useEffect } from 'react';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { ConfettiCelebration } from '@/components/UI/ConfettiCelebration';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Plus, CheckCircle, Clock, Trophy, Flame, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

interface Goal {
  id: string;
  title: string;
  goal_type: string;
  target: number;
  current: number;
  completed: boolean;
  due_date: string | null;
  created_at: string;
}

const GoalsPage = () => {
  const { user } = useAuth();
  const [newGoal, setNewGoal] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('daily');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from('study_goals' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setGoals((data as any[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const addGoal = async () => {
    if (!newGoal.trim() || !user) return;
    const { data, error } = await supabase.from('study_goals' as any).insert({
      user_id: user.id,
      title: newGoal.trim(),
      goal_type: tab,
      target: 1,
      current: 0,
      completed: false,
    }).select().single();

    if (error) { toast.error('Failed to add goal'); return; }
    setGoals(prev => [(data as any), ...prev]);
    setNewGoal('');
    toast.success('Goal added!');
  };

  const toggleGoal = async (goal: Goal) => {
    const newCompleted = !goal.completed;
    const { error } = await supabase.from('study_goals' as any)
      .update({
        completed: newCompleted,
        current: newCompleted ? goal.target : 0,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq('id', goal.id);

    if (!error) {
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, completed: newCompleted, current: newCompleted ? g.target : 0 } : g));
      if (newCompleted) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 100);
        toast.success('🎉 Goal completed!');
      }
    }
  };

  const deleteGoal = async (id: string) => {
    await supabase.from('study_goals' as any).delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
    toast.success('Goal removed');
  };

  const dailyGoals = goals.filter(g => g.goal_type === 'daily');
  const weeklyGoals = goals.filter(g => g.goal_type === 'weekly');
  const completedCount = goals.filter(g => g.completed).length;
  const dailyStreak = dailyGoals.filter(g => g.completed).length;

  if (loading) {
    return <div className="max-w-4xl mx-auto py-12 px-4"><LogoLoader text="Loading goals..." /></div>;
  }

  return (
    <>
      <ConfettiCelebration trigger={showConfetti} />
      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Study Goals
          </h1>
          <p className="text-sm text-muted-foreground">Track your daily and weekly learning targets</p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Goals', value: goals.length, icon: Target, accent: 'text-primary bg-primary/10' },
            { label: 'Completed', value: completedCount, icon: Trophy, accent: 'text-emerald-500 bg-emerald-500/10' },
            {
              label: 'Daily Streak',
              value: dailyStreak,
              icon: Flame,
              accent: 'text-orange-500 bg-orange-500/10',
              extra: dailyStreak >= 3,
            },
          ].map((s, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.accent}`}>
                  <s.icon className={`w-5 h-5 ${s.extra ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                {/* Fire animation for streaks */}
                {s.extra && (
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-lg ml-auto"
                  >
                    🔥
                  </motion.span>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="daily">Daily ({dailyGoals.length})</TabsTrigger>
            <TabsTrigger value="weekly">Weekly ({weeklyGoals.length})</TabsTrigger>
          </TabsList>

          {['daily', 'weekly'].map(type => (
            <TabsContent key={type} value={type} className="space-y-3 mt-4">
              <div className="flex gap-2">
                <Input
                  placeholder={`Add a ${type} goal...`}
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGoal()}
                  className="text-sm"
                />
                <Button size="icon" onClick={addGoal} className="shrink-0"><Plus className="w-4 h-4" /></Button>
              </div>

              {(type === 'daily' ? dailyGoals : weeklyGoals).map(goal => (
                <motion.div key={goal.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    goal.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'border-border/50 hover:border-primary/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => toggleGoal(goal)}>
                        {goal.completed
                          ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          : <Clock className="w-4 h-4 text-muted-foreground shrink-0" />}
                        <span className={`text-sm truncate ${goal.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {goal.title}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteGoal(goal.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                    <Progress value={goal.completed ? 100 : 0} className="h-1.5 mt-2" />
                  </div>
                </motion.div>
              ))}

              {(type === 'daily' ? dailyGoals : weeklyGoals).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No {type} goals yet. Add one above!</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </>
  );
};

export default GoalsPage;
