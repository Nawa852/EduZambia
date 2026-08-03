import React from 'react';
import { useNavigate } from 'react-router-dom';
import LearningCircle from '@/components/Study/LearningCircle';
import { Sparkles, Timer, CalendarDays, FolderOpen, ChevronRight } from 'lucide-react';

const shortcuts = [
  { label: 'Synapse It', hint: 'Turn any file into a study pack', icon: Sparkles, to: '/synapse' },
  { label: 'Focus timer', hint: '25-minute deep work block', icon: Timer, to: '/practice?tab=focus' },
  { label: 'Revision plan', hint: 'Pace the week before exams', icon: CalendarDays, to: '/practice?tab=planner' },
  { label: 'Resources', hint: 'Everything you have uploaded', icon: FolderOpen, to: '/practice?tab=resources' },
];

const rules = [
  'Study in loops, not lines — one full circle beats five hours of re-reading.',
  'Quiz yourself before you feel ready. The struggle is what builds recall.',
  'Review flashcards the day after, then three days later, then a week later.',
];

const LearningCirclePage = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <LearningCircle />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {shortcuts.map((s) => (
          <button
            key={s.label}
            onClick={() => navigate(s.to)}
            className="group text-left rounded-[18px] border border-border/50 bg-card/60 hover:border-primary/30 hover:bg-primary/[0.04] transition-all p-3.5"
          >
            <span className="w-9 h-9 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center mb-2.5">
              <s.icon className="w-4 h-4" />
            </span>
            <span className="block text-[13.5px] font-semibold leading-tight">{s.label}</span>
            <span className="block text-[11.5px] text-muted-foreground mt-0.5 leading-snug">{s.hint}</span>
          </button>
        ))}
      </div>

      <div className="rounded-[20px] border border-border/50 bg-card/60 p-4 sm:p-5">
        <h3 className="text-[14px] font-semibold tracking-[-0.01em] mb-2.5">How the circle works</h3>
        <ul className="space-y-2">
          {rules.map((r) => (
            <li key={r} className="flex gap-2.5 text-[12.5px] text-muted-foreground leading-relaxed">
              <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LearningCirclePage;
