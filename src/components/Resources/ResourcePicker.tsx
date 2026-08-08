import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, FileText, Check } from 'lucide-react';
import { useResources } from '@/hooks/useResources';
import type { RepositoryItem } from '@/lib/resourceRepository';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (items: RepositoryItem[]) => void;
  multiple?: boolean;
  title?: string;
}

/**
 * Lets any page pull files out of the shared repository — notes, study room,
 * lesson planner, test generator — so resources are usable everywhere.
 */
export const ResourcePicker: React.FC<Props> = ({
  open, onOpenChange, onSelect, multiple = true, title = 'Choose from your resources',
}) => {
  const { items, loading } = useResources();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      i.title.toLowerCase().includes(q)
      || (i.subject || '').toLowerCase().includes(q)
      || i.folder_path.toLowerCase().includes(q));
  }, [items, query]);

  const toggle = (item: RepositoryItem) => {
    if (!multiple) { onSelect([item]); onOpenChange(false); return; }
    setSelected((s) => (s.includes(item.id) ? s.filter((x) => x !== item.id) : [...s, item.id]));
  };

  const confirm = () => {
    onSelect(items.filter((i) => selected.includes(i.id)));
    setSelected([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle className="text-base">{title}</DialogTitle></DialogHeader>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your files…"
            aria-label="Search your files"
            className="pl-9 rounded-xl"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 -mx-1 px-1">
          {loading
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)
            : filtered.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-10">No files yet — upload some first.</p>
              : filtered.map((item) => {
                const on = selected.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(item)}
                    aria-pressed={on}
                    className={`w-full flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                      on ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {on ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.folder_path}</p>
                    </div>
                    {item.subject && <Badge variant="secondary" className="text-[10px] shrink-0">{item.subject}</Badge>}
                  </button>
                );
              })}
        </div>

        {multiple && (
          <Button className="rounded-xl w-full" onClick={confirm} disabled={!selected.length}>
            Use {selected.length || ''} file{selected.length === 1 ? '' : 's'}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResourcePicker;
