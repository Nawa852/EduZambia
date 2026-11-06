import { Check, ChevronLeft, FileCheck2, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  reviewing: boolean;
  loading: boolean;
  ready: boolean;
  onGenerate: () => void;
  onReview: () => void;
  onSetup: () => void;
}

export function DocumentFlow({ reviewing, loading, ready, onGenerate, onReview, onSetup }: Props) {
  return (
    <div className="print:hidden space-y-3 border-b pb-4">
      <ol aria-label="Document progress" className="flex items-center gap-3 text-xs sm:text-sm">
        {['Curriculum', 'Review', 'Download'].map((label, index) => (
          <li key={label} className={`flex min-w-0 items-center gap-1.5 ${index === (reviewing ? 1 : 0) ? 'text-primary font-semibold' : 'text-muted-foreground'}`} aria-current={index === (reviewing ? 1 : 0) ? 'step' : undefined}>
            {reviewing && index === 0 ? <Check className="h-4 w-4 shrink-0" /> : <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs">{index + 1}</span>}
            {label}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        {reviewing ? <Button variant="ghost" onClick={onSetup}><ChevronLeft className="mr-1 h-4 w-4" />Curriculum & settings</Button> : <>
          <Button onClick={onGenerate} disabled={!ready || loading}><span className="mr-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}</span>{loading ? 'Drafting…' : 'Generate draft'}</Button>
          <Button variant="outline" onClick={onReview} disabled={loading}><FileCheck2 className="mr-2 h-4 w-4" />Edit manually</Button>
        </>}
      </div>
      {loading && <p role="status" className="text-sm text-muted-foreground">Drafting from your selected curriculum…</p>}
    </div>
  );
}