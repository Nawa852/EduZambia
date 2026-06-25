import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Curriculum {
  code: string;
  name: string;
  subtitle: string;
  flag: string;
  tint: string;
}

const CURRICULA: Curriculum[] = [
  { code: 'ECZ', name: 'ECZ', subtitle: 'Education Curriculum Zambia', flag: '🇿🇲', tint: 'bg-blue-500/10 text-blue-600' },
  { code: 'UNZA', name: 'UNZA', subtitle: 'University of Zambia', flag: '🎓', tint: 'bg-emerald-500/10 text-emerald-600' },
  { code: 'CAMBRIDGE', name: 'CAMBRIDGE', subtitle: 'Cambridge International', flag: '🇬🇧', tint: 'bg-indigo-500/10 text-indigo-600' },
  { code: 'SABER', name: 'SABER', subtitle: 'SABER Curriculum', flag: '📚', tint: 'bg-amber-500/10 text-amber-600' },
  { code: 'IGCSE', name: 'IGCSE', subtitle: 'International General Certificate', flag: '🌍', tint: 'bg-purple-500/10 text-purple-600' },
  { code: 'ZIMSEC', name: 'ZIMSEC', subtitle: 'Zimbabwe School Examinations', flag: '🇿🇼', tint: 'bg-rose-500/10 text-rose-600' },
  { code: 'NIGERIAN', name: 'NIGERIAN', subtitle: 'Nigerian Curriculum', flag: '🇳🇬', tint: 'bg-green-600/10 text-green-700' },
  { code: 'KENYA', name: 'KENYA 8-4-4', subtitle: 'Kenya National Curriculum', flag: '🇰🇪', tint: 'bg-red-500/10 text-red-600' },
  { code: 'GHANA', name: 'GHANA', subtitle: 'Ghana Education Service', flag: '🇬🇭', tint: 'bg-yellow-600/10 text-yellow-700' },
];

const STORAGE_KEY = 'edu-zambia-curriculum';

export function getCurrentCurriculum(): Curriculum {
  try {
    const code = localStorage.getItem(STORAGE_KEY);
    return CURRICULA.find(c => c.code === code) || CURRICULA[0];
  } catch {
    return CURRICULA[0];
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CurriculumSwitcher({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState<Curriculum>(getCurrentCurriculum());
  const [confirmation, setConfirmation] = useState<Curriculum | null>(null);

  const filtered = CURRICULA.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const select = (c: Curriculum) => {
    if (c.code === current.code) {
      onOpenChange(false);
      return;
    }
    localStorage.setItem(STORAGE_KEY, c.code);
    setCurrent(c);
    onOpenChange(false);
    setConfirmation(c);
    toast.success(`Switched to ${c.name}`);
    window.dispatchEvent(new CustomEvent('curriculum-changed', { detail: c }));
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[85vh] overflow-hidden flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="text-base font-bold text-left">Select Curriculum</SheetTitle>
          </SheetHeader>

          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search curriculum..."
                className="pl-9 rounded-xl h-10 bg-muted/40 border-border/40"
              />
            </div>
          </div>

          <div className="overflow-y-auto px-5 pb-6 space-y-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Current Curriculum
              </div>
              <button
                onClick={() => select(current)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/20"
              >
                <div className={`w-9 h-9 rounded-xl ${current.tint} flex items-center justify-center text-lg`}>
                  {current.flag}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold">{current.name}</div>
                  <div className="text-[11px] text-muted-foreground">{current.subtitle}</div>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                </div>
              </button>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                All Curricula
              </div>
              <div className="space-y-2">
                {filtered.filter(c => c.code !== current.code).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => select(c)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/60 active:bg-muted transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-xl ${c.tint} flex items-center justify-center text-lg`}>
                      {c.flag}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.subtitle}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>

            <button className="w-full text-xs text-primary font-medium pt-2">
              View all 50+ curricula
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!confirmation} onOpenChange={() => setConfirmation(null)}>
        <DialogContent className="max-w-[320px] rounded-3xl p-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
          </div>
          <div className="text-base font-bold mb-3">Curriculum Changed!</div>
          {confirmation && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-lg ${confirmation.tint} flex items-center justify-center text-base`}>
                {confirmation.flag}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold leading-tight">{confirmation.name}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{confirmation.subtitle}</div>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mb-4">
            Your curriculum has been successfully updated.
          </p>
          <Button onClick={() => setConfirmation(null)} className="w-full rounded-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
