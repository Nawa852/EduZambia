import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CurriculumSourceRegister() {
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['curriculum-source-registry'],
    queryFn: async () => {
      const result = await supabase.from('curriculum_source_registry').select('*').order('title');
      if (result.error) throw result.error;
      return result.data;
    },
  });
  return <section className="border-t border-border py-5">
    <h2 className="flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4 text-primary" />Curriculum sources <span className="text-sm text-muted-foreground">{data.length}</span></h2>
    {isLoading && <p className="mt-3 text-sm text-muted-foreground">Loading syllabus sources…</p>}
    {error && <div className="mt-3"><p className="text-sm text-destructive">Could not load syllabus sources.</p><Button variant="outline" onClick={() => refetch()}>Retry</Button></div>}
    <div className="mt-3 grid gap-x-5 sm:grid-cols-2">
      {data.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3 border-b border-border/50 py-3 text-sm hover:text-primary">
        <div className="min-w-0 flex-1"><p className="break-words font-medium">{source.title}</p><p className="text-xs text-muted-foreground">{source.framework} · {source.status === 'pending_review' ? 'Pending content review' : source.status}</p></div><ExternalLink className="h-4 w-4 shrink-0" />
      </a>)}
    </div>
  </section>;
}