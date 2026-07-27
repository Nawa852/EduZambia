import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogoLoader } from '@/components/UI/LogoLoader';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, Star, Zap, Users, BookOpen, Calendar, 
  Award, TrendingUp, Clock, Brain
} from "lucide-react";

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  rarity: string;
  points: number;
  checkProgress: (data: any) => { earned: boolean; progress: number; total: number };
}

const achievementDefs: AchievementDef[] = [
  { id: 'first_lesson', title: 'First Steps', description: 'Complete your first lesson', icon: BookOpen, rarity: 'common', points: 50,
    checkProgress: (d) => ({ earned: d.lessons >= 1, progress: Math.min(d.lessons, 1), total: 1 }) },
  { id: 'speed_5', title: 'Speed Learner', description: 'Complete 5 lessons', icon: Zap, rarity: 'rare', points: 150,
    checkProgress: (d) => ({ earned: d.lessons >= 5, progress: Math.min(d.lessons, 5), total: 5 }) },
  { id: 'quiz_10', title: 'Quiz Master', description: 'Complete 10 quizzes', icon: Star, rarity: 'epic', points: 300,
    checkProgress: (d) => ({ earned: d.quizzes >= 10, progress: Math.min(d.quizzes, 10), total: 10 }) },
  { id: 'goals_5', title: 'Goal Getter', description: 'Complete 5 study goals', icon: Award, rarity: 'rare', points: 200,
    checkProgress: (d) => ({ earned: d.goals >= 5, progress: Math.min(d.goals, 5), total: 5 }) },
  { id: 'streak_7', title: 'Week Warrior', description: 'Achieve a 7-day study streak', icon: Clock, rarity: 'epic', points: 250,
    checkProgress: (d) => ({ earned: d.streak >= 7, progress: Math.min(d.streak, 7), total: 7 }) },
  { id: 'courses_3', title: 'Knowledge Seeker', description: 'Enroll in 3 courses', icon: Brain, rarity: 'uncommon', points: 100,
    checkProgress: (d) => ({ earned: d.courses >= 3, progress: Math.min(d.courses, 3), total: 3 }) },
];

const rarityStyles: Record<string, { badge: string; glow: string }> = {
  common: { badge: 'bg-muted text-muted-foreground', glow: '' },
  uncommon: { badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', glow: '' },
  rare: { badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20', glow: 'ring-1 ring-blue-500/20' },
  epic: { badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20', glow: 'ring-1 ring-purple-500/20' },
  legendary: { badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20', glow: 'ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/10' },
};

const AchievementSystem = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [playerData, setPlayerData] = useState({ lessons: 0, quizzes: 0, goals: 0, streak: 0, courses: 0, xp: 0 });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const [{ count: lessonCount }, { count: quizCount }, { count: goalCount }, { count: courseCount }, { data: statsData }] = await Promise.all([
        supabase.from('lesson_completions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('study_goals').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        (supabase as any).from('user_stats').select('total_xp, current_streak').eq('user_id', user.id).maybeSingle(),
      ]);

      setPlayerData({
        lessons: lessonCount || 0,
        quizzes: quizCount || 0,
        goals: goalCount || 0,
        courses: courseCount || 0,
        streak: statsData?.current_streak || 0,
        xp: statsData?.total_xp || 0,
      });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div className="max-w-5xl mx-auto py-12 px-4"><LogoLoader text="Loading achievements..." /></div>;

  const achievements = achievementDefs.map(def => {
    const { earned, progress, total } = def.checkProgress(playerData);
    return { ...def, earned, progress, total };
  });

  const earnedCount = achievements.filter(a => a.earned).length;
  const totalXP = achievements.filter(a => a.earned).reduce((s, a) => s + a.points, 0);
  const userLevel = Math.floor(totalXP / 500) + 1;
  const nextLevelXP = userLevel * 500;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" /> Achievements
        </h1>
        <p className="text-sm text-muted-foreground">{earnedCount}/{achievements.length} unlocked · Level {userLevel}</p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-lg font-bold text-foreground">Level {userLevel}</p>
                <p className="text-xs text-muted-foreground">Learning Champion</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">{totalXP.toLocaleString()} XP</p>
                <p className="text-xs text-muted-foreground">{nextLevelXP - totalXP} to next level</p>
              </div>
            </div>
            <Progress value={(totalXP / nextLevelXP) * 100} className="h-2.5" />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((a) => (
            <Card key={a.id} className={`border-border/50 transition-all ${a.earned ? rarityStyles[a.rarity]?.glow : 'opacity-70'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${a.earned ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <a.icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${rarityStyles[a.rarity]?.badge}`}>
                    {a.rarity}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm text-foreground">{a.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{a.description}</p>
                {a.earned ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">+{a.points} XP ✓</Badge>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{a.progress}/{a.total}</span>
                    </div>
                    <Progress value={(a.progress / a.total) * 100} className="h-1.5" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AchievementSystem;
