import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { cn } from '@/lib/utils';
import { Upload, Lightbulb, Target, Repeat, Trophy, ChevronRight, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Stage = {
  id: string;
  label: string;
  verb: string;
  hint: string;
  icon: LucideIcon;
  to: string;
  done: boolean;
  count: number;
};

const RADIUS = 74;
const STROKE = 12;
const SIZE = (RADIUS + STROKE) * 2;
const GAP = 0.055; // fraction of circle left empty between segments

/** Circular five-step study loop: Capture → Understand → Practice → Review → Master. */
export const LearningCircle: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [d, setD] = useState({ resources: 0, packs: 0, quizzes: 0, reviews: 0, streak: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    let cancelled = false;
    (async () => {
      const weekAgo = new Date(Date.now() - 6 * 864e5).toISOString();
      const [res, notes, quiz, cards, stats] = await Promise.all([
        supabase.from('study_resources').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', weekAgo),
        supabase.from('student_notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('updated_at', weekAgo),
        supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', weekAgo),
        supabase.from('flashcard_decks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_stats').select('current_streak').eq('user_id', user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setD({
        resources: res.count ?? 0,
        packs: notes.count ?? 0,
        quizzes: quiz.count ?? 0,
        reviews: cards.count ?? 0,
        streak: stats.data?.current_streak ?? 0,
      });
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const stages: Stage[] = useMemo(() => [
    { id: 'capture', label: 'Capture', verb: 'Add material', hint: 'Upload notes, a photo or a past paper', icon: Upload, to: '/synapse', done: d.resources > 0, count: d.resources },
    { id: 'understand', label: 'Understand', verb: 'Break it down', hint: 'Summary, key points and a visual lesson', icon: Lightbulb, to: '/practice?tab=know-your-stuff', done: d.packs > 0, count: d.packs },
    { id: 'practice', label: 'Practice', verb: 'Test yourself', hint: 'ECZ quiz questions with instant feedback', icon: Target, to: '/practice?tab=quiz', done: d.quizzes > 0, count: d.quizzes },
    { id: 'review', label: 'Review', verb: 'Space it out', hint: 'Flashcards resurface right before you forget', icon: Repeat, to: '/flashcards', done: d.reviews > 0, count: d.reviews },
    { id: 'master', label: 'Master', verb: 'Prove it', hint: 'Timed mock exam under real conditions', icon: Trophy, to: '/practice?tab=simulator', done: d.streak > 0, count: d.streak },
  ], [d]);

  const doneCount = stages.filter((s) => s.done).length;
  const pct = Math.round((doneCount / stages.length) * 100);
  const next = stages.find((s) => !s.done) ?? stages[0];

  const circumference = 2 * Math.PI * RADIUS;
  const seg = circumference / stages.length;
  const dash = seg * (1 - GAP);

  if (variant === 'summary') {
    const r = 34, s = 7, size = (r + s) * 2;
    const c = 2 * Math.PI * r;
    return (
      <button
        onClick={() => navigate('/practice?tab=circle')}
        className="w-full text-left rounded-[22px] border border-border/40 bg-card shadow-sm p-4 flex items-center gap-4 hover:border-primary/30 transition-all"
      >
        <span className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={s} className="stroke-muted" />
            <circle
              cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={s} strokeLinecap="round"
              className="stroke-primary transition-[stroke-dashoffset] duration-700"
              strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[17px] font-extrabold leading-none tracking-[-0.03em]">{pct}%</span>
            <span className="text-[9px] text-muted-foreground mt-0.5">This week</span>
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-snug tracking-[-0.01em]">
            Finish the 5 steps each week and the knowledge sticks.
          </span>
          <span className="block text-[13px] font-semibold text-primary mt-1.5">{doneCount} / {stages.length} steps</span>
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    );
  }

  return (
    <div className="rounded-[24px] border border-border/50 bg-card/70 supports-[backdrop-filter]:bg-card/60 backdrop-blur-xl p-4 sm:p-6">

      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Ring */}
        <div className="relative mx-auto shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            {stages.map((s, i) => (
              <circle
                key={s.id}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE}
                strokeLinecap="round"
                className={cn(
                  'transition-[stroke,opacity] duration-700',
                  s.done ? 'stroke-primary' : 'stroke-muted-foreground/15',
                )}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-seg * i - (seg * GAP) / 2}
                opacity={loaded ? 1 : 0.4}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[32px] font-semibold tracking-[-0.03em] leading-none">{pct}%</span>
            <span className="text-[11px] text-muted-foreground mt-1">loop this week</span>
            <span className="text-[11px] font-medium text-primary mt-0.5">{doneCount}/{stages.length} steps</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Your learning circle</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Five steps, one loop. Finish the circle each week and the material sticks.
            </p>
          </div>

          <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'sm:grid-cols-2')}>
            {stages.map((s, i) => (
              <button
                key={s.id}
                onClick={() => navigate(s.to)}
                className={cn(
                  'group flex items-center gap-3 text-left rounded-[16px] border px-3 py-2.5 transition-all',
                  s.id === next.id
                    ? 'border-primary/40 bg-primary/[0.06] shadow-sm'
                    : 'border-border/50 bg-background/40 hover:border-primary/25 hover:bg-primary/[0.04]',
                )}
              >
                <span
                  className={cn(
                    'relative w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 transition-colors',
                    s.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {s.done ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-card border border-border/60 text-[9px] font-bold flex items-center justify-center text-muted-foreground">
                    {i + 1}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[13.5px] font-semibold leading-tight">{s.label}</span>
                    {s.count > 0 && (
                      <span className="px-1.5 py-px rounded-full bg-primary/10 text-primary text-[10px] font-bold leading-none">
                        {s.count}
                      </span>
                    )}
                  </span>
                  <span className="block text-[11.5px] text-muted-foreground truncate">{s.hint}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate(next.to)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold shadow-sm shadow-primary/20 hover:opacity-90 transition-opacity"
          >
            {next.verb}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningCircle;
