import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/UI/EmptyState';
import {
  UploadCloud, FileText, Image as ImageIcon, Film, Music, FileSpreadsheet,
  Presentation, File as FileIcon, Trash2, ExternalLink, Loader2, Search, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import {
  uploadToRepository, listRepository, getResourceUrl, deleteResource,
  type RepositoryItem, type ResourceKind,
} from '@/lib/resourceRepository';

const KIND_ICON: Record<ResourceKind, React.ElementType> = {
  pdf: FileText, document: FileText, slides: Presentation, spreadsheet: FileSpreadsheet,
  image: ImageIcon, video: Film, audio: Music, other: FileIcon,
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const ECZResourcesExpandedPage = () => {
  const { profile } = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState('');

  // File opener
  const [openItem, setOpenItem] = useState<RepositoryItem | null>(null);
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [openLoading, setOpenLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await listRepository());
    } catch {
      toast.error('Could not load your resources');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        await uploadToRepository({ file, role: profile?.role ?? null, source: 'repository' });
        ok += 1;
      } catch (err) {
        toast.error((err as Error).message);
      }
    }
    setUploading(false);
    if (ok) toast.success(`${ok} file${ok > 1 ? 's' : ''} added to your repository`);
    load();
  };

  const open = async (item: RepositoryItem) => {
    setOpenItem(item);
    setOpenUrl(null);
    setOpenLoading(true);
    const url = await getResourceUrl(item);
    setOpenUrl(url);
    setOpenLoading(false);
    if (!url) toast.error('Could not open this file');
  };

  const remove = async (item: RepositoryItem) => {
    await deleteResource(item);
    toast.success('Removed');
    load();
  };

  const filtered = items.filter((i) =>
    !query.trim() || i.title.toLowerCase().includes(query.toLowerCase()) ||
    i.folder_path.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        aria-label="Upload files to your repository"
        className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/20'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
        {uploading ? (
          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
        ) : (
          <UploadCloud className="w-8 h-8 mx-auto text-primary" />
        )}
        <p className="mt-3 text-sm font-medium">
          {uploading ? 'Uploading…' : 'Drop files here or tap to upload'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDFs, documents, slides, images, audio and video — sorted automatically into folders.
        </p>
      </div>

      {/* Search */}
      {items.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your files…"
            className="pl-9"
            aria-label="Search files"
          />
        </div>
      )}

      {/* Files */}
      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UploadCloud}
          title={items.length ? 'No matches' : 'Your repository is empty'}
          description={items.length
            ? 'Try a different search term.'
            : 'Everything you upload anywhere in Synapse lands here, neatly organised.'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const Icon = KIND_ICON[item.kind] ?? FileIcon;
            return (
              <Card key={item.id} className="border-border/60 hover:border-primary/40 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <button
                    onClick={() => open(item)}
                    className="flex-1 min-w-0 text-left"
                    aria-label={`Open ${item.title}`}
                  >
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.folder_path} · {formatSize(item.size_bytes)}
                    </p>
                  </button>
                  <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">{item.kind}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => open(item)} aria-label="Open file">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(item)} aria-label="Delete file">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Embedded file opener */}
      <Dialog open={!!openItem} onOpenChange={(o) => { if (!o) { setOpenItem(null); setOpenUrl(null); } }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b border-border/60">
            <DialogTitle className="text-sm truncate pr-8">{openItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/30">
            {openLoading || !openUrl ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : openItem?.kind === 'image' ? (
              <div className="h-full overflow-auto flex items-center justify-center p-4">
                <img src={openUrl} alt={openItem.title} className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            ) : openItem?.kind === 'video' ? (
              <video src={openUrl} controls className="w-full h-full bg-black" />
            ) : openItem?.kind === 'audio' ? (
              <div className="h-full flex items-center justify-center p-6">
                <audio src={openUrl} controls className="w-full max-w-md" />
              </div>
            ) : (
              <iframe src={openUrl} title={openItem?.title ?? 'File'} className="w-full h-full border-0" />
            )}
          </div>
          {openUrl && (
            <div className="px-4 py-3 border-t border-border/60 flex justify-end">
              <Button size="sm" variant="outline" asChild>
                <a href={openUrl} target="_blank" rel="noreferrer" download>
                  <Download className="w-4 h-4 mr-2" /> Download
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ECZResourcesExpandedPage;
