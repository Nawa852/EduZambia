import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RepositoryItem,
  deleteResource,
  getResourceUrl,
  groupByFolder,
  listRepository,
  uploadToRepository,
} from '@/lib/resourceRepository';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  FileText, Image as ImageIcon, Film, Music, Table2, Presentation, File,
  Upload, FolderOpen, Search, Trash2, Download,
} from 'lucide-react';

const KIND_ICON: Record<string, React.ElementType> = {
  pdf: FileText,
  document: FileText,
  image: ImageIcon,
  video: Film,
  audio: Music,
  spreadsheet: Table2,
  slides: Presentation,
  other: File,
};

function formatSize(bytes?: number | null) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const ResourceRepositoryPage: React.FC = () => {
  const { profile } = useProfile();
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listRepository());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        await uploadToRepository({
          file,
          subject: subject.trim() || null,
          role: profile?.role ?? null,
          source: 'resource-repository',
        });
        ok++;
      } catch (e) {
        toast.error(`${file.name} failed`, { description: (e as Error).message });
      }
    }
    setUploading(false);
    if (ok) {
      toast.success(`${ok} file${ok > 1 ? 's' : ''} filed into your repository`);
      void load();
    }
  };

  const open = async (item: RepositoryItem) => {
    const url = await getResourceUrl(item);
    if (url) window.open(url, '_blank', 'noopener');
    else toast.error('Could not open this resource');
  };

  const remove = async (item: RepositoryItem) => {
    await deleteResource(item);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success('Resource removed');
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.folder_path.toLowerCase().includes(q) ||
        (i.subject ?? '').toLowerCase().includes(q),
    );
  }, [items, query]);

  const folders = useMemo(() => groupByFolder(filtered), [filtered]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary" /> Resource Repository
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every upload across Synapse lands here, automatically filed by role, subject and file type.
        </p>
      </header>

      <Card
        className="border-dashed"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm font-medium">Drop files here or choose from your device</p>
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
            <Input
              placeholder="Subject (optional) — e.g. Biology"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-label="Subject for uploads"
            />
            <Button onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Choose files'}
            </Button>
          </div>
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search your repository"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search resources"
        />
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">We couldn’t load your resources. {error}</p>
            <Button variant="outline" onClick={() => void load()}>Try again</Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center space-y-2">
            <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="font-medium">Nothing filed yet</p>
            <p className="text-sm text-muted-foreground">
              Upload notes, past papers, slides or recordings and Synapse will organise them for you.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && Object.entries(folders).map(([folder, folderItems]) => (
        <section key={folder} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <FolderOpen className="w-4 h-4" /> {folder}
            <Badge variant="secondary" className="text-[10px]">{folderItems.length}</Badge>
          </h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {folderItems.map((item) => {
                const Icon = KIND_ICON[item.kind] ?? File;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    <Icon className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(item.size_bytes)} · {new Date(item.created_at).toLocaleDateString()}
                        {item.source ? ` · ${item.source}` : ''}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" aria-label={`Open ${item.title}`} onClick={() => void open(item)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={`Delete ${item.title}`} onClick={() => void remove(item)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
};

export default ResourceRepositoryPage;
