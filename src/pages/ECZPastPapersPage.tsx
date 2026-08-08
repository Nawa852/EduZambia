import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { ErrorState } from '@/components/UI/ErrorState';
import {
  UploadCloud, Search, Folder, FileText, Image as ImageIcon, Film, Music,
  FileSpreadsheet, Presentation, File as FileIcon, Trash2, Sparkles, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { getResourcePermissions } from '@/lib/resourcePermissions';
import { useResources } from '@/hooks/useResources';
import { QuickUpload } from '@/components/Resources/QuickUpload';
import { ResourceViewer } from '@/components/Resources/ResourceViewer';
import { formatSize } from '@/components/Resources/ResourceCard';
import type { RepositoryItem, ResourceKind } from '@/lib/resourceRepository';

const KIND_ICON: Record<ResourceKind, React.ElementType> = {
  pdf: FileText, document: FileText, slides: Presentation, spreadsheet: FileSpreadsheet,
  image: ImageIcon, video: Film, audio: Music, other: FileIcon,
};

const ECZPastPapersPage = () => {
  const { profile } = useProfile();
  const role = (profile?.role as string) || 'student';
  const perms = useMemo(() => getResourcePermissions(role), [role]);
  const { items, folders, loading, error, refresh, remove } = useResources();

  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<RepositoryItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (folder && i.folder_path !== folder) return false;
      if (!q) return true;
      return i.title.toLowerCase().includes(q)
        || (i.subject || '').toLowerCase().includes(q)
        || i.folder_path.toLowerCase().includes(q);
    });
  }, [items, query, folder]);

  const countIn = (path: string) => items.filter((i) => i.folder_path === path).length;

  const del = async (item: RepositoryItem) => {
    try {
      await remove.mutateAsync(item);
      toast.success('Removed');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Papers & materials</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Upload as many files as you like. Synapse keeps them exactly as they are — open any file
          to read it, get a summary, flashcards, a quiz, or ask questions about it.
        </p>
      </div>

      {perms.canUpload && (
        <QuickUpload perms={perms} role={role} folder={folder} onUploaded={refresh} />
      )}

      {items.length > 0 && (
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
      )}

      {folder ? (
        <button
          onClick={() => setFolder(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> All files
          <span className="text-foreground font-medium ml-1">/ {folder}</span>
        </button>
      ) : folders.length > 0 && !query.trim() && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className="rounded-2xl border border-border/60 bg-card/60 p-3.5 text-left hover:border-primary/40 transition-colors"
            >
              <Folder className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium mt-2 truncate">{f.split('/').pop()}</p>
              <p className="text-xs text-muted-foreground">{countIn(f)} file{countIn(f) === 1 ? '' : 's'}</p>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : error ? (
        <ErrorState title="Could not load your files" onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UploadCloud}
          title={items.length ? 'No matches' : 'Nothing uploaded yet'}
          description={items.length
            ? 'Try a different search term.'
            : 'Drop in past papers, notes or photos of your exercise book — they will all show up here.'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const Icon = KIND_ICON[item.kind] ?? FileIcon;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border/60 bg-card/60 p-3 flex items-center gap-3"
              >
                <button
                  onClick={() => setViewItem(item)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatSize(item.size_bytes)} · {item.folder_path}
                    </p>
                  </div>
                </button>
                {item.subject && (
                  <Badge variant="secondary" className="text-[10px] shrink-0 hidden sm:inline-flex">
                    {item.subject}
                  </Badge>
                )}
                <Button size="sm" className="rounded-xl shrink-0" onClick={() => setViewItem(item)}>
                  <Sparkles className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Open</span>
                </Button>
                {perms.canDelete && (
                  <Button
                    size="icon" variant="ghost" className="h-8 w-8 shrink-0"
                    aria-label={`Delete ${item.title}`} onClick={() => del(item)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ResourceViewer item={viewItem} onClose={() => setViewItem(null)} />
    </div>
  );
};

export default ECZPastPapersPage;
