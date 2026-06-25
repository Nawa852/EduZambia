import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Sparkles, BookOpenCheck, ListOrdered, PenLine, Languages, Mic, ChevronRight } from 'lucide-react';

const shortcuts = [
  {
    label: 'Homework Help',
    desc: 'Solve a problem step-by-step',
    icon: BookOpenCheck,
    tint: 'bg-blue-500/10 text-blue-600',
    prompt: 'Help me with my homework. I will paste the problem next — explain the concept, then guide me to the answer step-by-step.',
    to: '/ai?tab=chat',
  },
  {
    label: 'Step-by-Step',
    desc: 'Detailed worked explanations',
    icon: ListOrdered,
    tint: 'bg-emerald-500/10 text-emerald-600',
    prompt: 'Explain the following step-by-step, like I am preparing for an ECZ exam. Number each step clearly and explain the reasoning.',
    to: '/ai?tab=chat',
  },
  {
    label: 'Essay Assistant',
    desc: 'Outline, draft, polish',
    icon: PenLine,
    tint: 'bg-violet-500/10 text-violet-600',
    prompt: 'Be my essay assistant. Ask me for the topic and level, then produce a thesis, outline, and draft with strong examples and citations.',
    to: '/ai?tab=chat',
  },
  {
    label: 'Translate',
    desc: 'Bemba · Nyanja · Tonga · Lozi',
    icon: Languages,
    tint: 'bg-amber-500/10 text-amber-600',
    prompt: 'Translate the text I paste next between English and a Zambian language (Bemba, Nyanja, Tonga, or Lozi). Ask which language to use.',
    to: '/ai?tab=chat',
  },
  {
    label: 'Voice Tutor',
    desc: 'Talk it through aloud',
    icon: Mic,
    tint: 'bg-rose-500/10 text-rose-600',
    prompt: 'Start a voice tutoring conversation. Greet me and ask what subject I want to discuss today.',
    to: '/ai?tab=tutor&mode=voice',
  },
];

export default function AIShortcutsCard() {
  const navigate = useNavigate();
  const go = (s: typeof shortcuts[number]) => {
    const sep = s.to.includes('?') ? '&' : '?';
    navigate(`${s.to}${sep}prompt=${encodeURIComponent(s.prompt)}`);
  };
  return (
    <Card className="p-4 lg:p-5 rounded-2xl border-border/40 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">AI Shortcuts</span>
        </div>
        <button onClick={() => navigate('/ai')} className="text-xs text-primary font-medium hover:underline">More AI</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {shortcuts.map(s => (
          <button
            key={s.label}
            onClick={() => go(s)}
            className="group text-left p-3 rounded-xl bg-card border border-border/30 hover:border-primary/40 hover:shadow-elevated transition-all"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${s.tint} group-hover:scale-105 transition-transform`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[12.5px] font-bold leading-tight">{s.label}</div>
              <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">{s.desc}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}
