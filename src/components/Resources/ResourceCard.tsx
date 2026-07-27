import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Image as ImageIcon, Film, Music, FileSpreadsheet, Presentation,
  File as FileIcon, Trash2, Download, Link as LinkIcon, Eye, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { getResourceUrl, type RepositoryItem, type ResourceKind } from '@/lib/resourceRepository';

const KIND_ICON: Record<ResourceKind, React.ElementType> = {
  pdf: FileText, document: FileText, slides: Presentation, spreadsheet: FileSpreadsheet,
  image: ImageIcon, video: Film, audio: Music, other: FileIcon,
};

export const formatSize = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const tagValue = (item: RepositoryItem, prefix: string) =>
  (item.tags || []).find((t) => t.startsWith(`${prefix}:`))?.split(':')[1] ?? null;

interface Props {
  item: RepositoryItem;
  canDelete: boolean;
  onOpen: (item: RepositoryItem) => void;
  onDelete: (item: RepositoryItem) => void;
}

/** Thumbnail: real preview for images/PDF/video, icon tile otherwise. */
const Thumbnail: React.FC<{ item: RepositoryItem }> = ({ item }) => {
  const [url, setUrl] = useState<string | null>(null);
  const Icon = KIND_ICON[item.kind] ?? FileIcon;
  const previewable = item.kind === 'image' || item.kind === 'pdf' || item.kind === 'video';

  useEffect(() => {
    let active = true;
    if (!previewable) return;
    getResourceUrl(item).then((u) => { if (active) setUrl(u); });
    return () => { active = false; };
  }, [item, previewable]);

  const base = 'w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center';

  if (!previewable || !url) {
    return <div className={base}><Icon className="w-5 h-5 text-primary" /></div>;
  }
  if (item.kind === 'image') {
    return (
      <div className={base}>
        <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
      </div>
    );
  }
  if (item.kind === 'video') {
    return (
      <div className={`${base} bg-black`}>
        <video src={`${url}#t=1`} muted preload="metadata" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${base} bg-white relative`}>
      <iframe
        src={`${url}#toolbar=0&navpanes=0&view=FitH`}
        title=""
        tabIndex={-1}
        className="w-[224px] h-[224px] origin-top-left scale-[0.25] border-0 pointer-events-none"
      />
    </div>
  );
};

export const ResourceCard: React.FC<Props> = ({ item, canDelete, onOpen, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const cls = tagValue(item, 'class');
  const year = tagValue(item, 'year');

  const copyLink = async () => {
    const url = await getResourceUrl(item);
    if (!url) { toast.error('Could not create a share link'); return; }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Share link copied (valid for 1 hour)');
    setTimeout(() => setCopied(false), 1800);
  };

  const download = async () => {
    const url = await getResourceUrl(item);
    if (!url) { toast.error('Could not prepare the download'); return; }
    const a = document.createElement('a');
    a.href = url;
    a.download = item.title;
    a.rel = 'noreferrer';
    a.click();
  };

  return (
    <Card className="border-border/60 hover:border-primary/40 transition-colors">
      <CardContent className="p-3 flex items-center gap-3">
        <Thumbnail item={item} />
        <button onClick={() => onOpen(item)} className="flex-1 min-w-0 text-left" aria-label={`Open ${item.title}`}>
          <p className="text-sm font-medium truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {[item.subject, cls, year, formatSize(item.size_bytes)].filter(Boolean).join(' · ')}
          </p>
          <div className="flex gap-1.5 mt-1">
            <Badge variant="secondary" className="text-[10px]">{item.kind}</Badge>
            {item.is_public && <Badge className="text-[10px]">Shared</Badge>}
          </div>
        </button>
        <div className="flex items-center">
          <Button size="icon" variant="ghost" onClick={() => onOpen(item)} aria-label="Preview file">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={download} aria-label="Download file">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={copyLink} aria-label="Copy share link">
            {copied ? <Check className="w-4 h-4 text-primary" /> : <LinkIcon className="w-4 h-4" />}
          </Button>
          {canDelete && (
            <Button size="icon" variant="ghost" onClick={() => onDelete(item)} aria-label="Delete file">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceCard;
