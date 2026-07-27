import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { UploadCloud, Loader2, RotateCw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { uploadToRepository, detectKind } from '@/lib/resourceRepository';
import { validateFile, type ResourcePermissions } from '@/lib/resourcePermissions';

export const SUBJECTS = [
  'Mathematics', 'English', 'Biology', 'Chemistry', 'Physics', 'Science',
  'Civic Education', 'Geography', 'History', 'Computer Studies',
  'Business Studies', 'Religious Education', 'Other',
];

export const CLASS_LEVELS = [
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Tertiary', 'General',
];

interface QueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface Props {
  perms: ResourcePermissions;
  role: string | null;
  onUploaded: () => void;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, i) => String(currentYear - i));

export const ResourceUploader: React.FC<Props> = ({ perms, role, onUploaded }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [subject, setSubject] = useState('Other');
  const [classLevel, setClassLevel] = useState('General');
  const [year, setYear] = useState(String(currentYear));
  const [shared, setShared] = useState(false);

  const patch = (id: string, next: Partial<QueueItem>) =>
    setQueue((q) => q.map((i) => (i.id === id ? { ...i, ...next } : i)));

  const runUpload = useCallback(async (item: QueueItem) => {
    patch(item.id, { status: 'uploading', progress: 8, error: undefined });
    const timer = setInterval(() => {
      setQueue((q) => q.map((i) => (i.id === item.id && i.status === 'uploading'
        ? { ...i, progress: Math.min(90, i.progress + 7) } : i)));
    }, 350);

    try {
      await uploadToRepository({
        file: item.file,
        role,
        subject,
        tags: [`class:${classLevel}`, `year:${year}`],
        isPublic: perms.canShare ? shared : false,
        source: 'repository',
      });
      clearInterval(timer);
      patch(item.id, { status: 'done', progress: 100 });
      onUploaded();
    } catch (err) {
      clearInterval(timer);
      patch(item.id, { status: 'error', progress: 0, error: (err as Error).message });
    }
  }, [role, subject, classLevel, year, shared, perms.canShare, onUploaded]);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    if (!perms.canUpload) { toast.error('Your account cannot upload resources'); return; }

    const accepted: QueueItem[] = [];
    for (const file of Array.from(files)) {
      const check = validateFile(file, perms, detectKind(file));
      if (!check.ok) { toast.error(`${file.name}: ${check.reason}`); continue; }
      accepted.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file, progress: 0, status: 'queued',
      });
    }
    if (!accepted.length) return;
    setQueue((q) => [...accepted, ...q]);
    accepted.forEach(runUpload);
  };

  const clearDone = () => setQueue((q) => q.filter((i) => i.status !== 'done'));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Subject</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Class</Label>
          <Select value={classLevel} onValueChange={setClassLevel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CLASS_LEVELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <Label className="text-xs">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {perms.canShare && (
        <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
          <Label htmlFor="share-toggle" className="text-xs font-medium">{perms.shareLabel}</Label>
          <Switch id="share-toggle" checked={shared} onCheckedChange={setShared} />
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        role="button"
        tabIndex={0}
        aria-label="Upload files to your repository"
        className={`rounded-2xl border-2 border-dashed p-7 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/20'
        }`}
      >
        <input ref={inputRef} type="file" multiple className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <UploadCloud className="w-8 h-8 mx-auto text-primary" />
        <p className="mt-3 text-sm font-medium">Drop files here or tap to upload</p>
        <p className="text-xs text-muted-foreground mt-1">
          {perms.uploadHint} Max {perms.maxSizeMb}MB per file.
        </p>
      </div>

      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Uploads</p>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={clearDone}>Clear finished</Button>
          </div>
          {queue.map((item) => (
            <div key={item.id} className="rounded-xl border border-border/60 px-3 py-2.5 space-y-2">
              <div className="flex items-center gap-2">
                {item.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                {item.status === 'done' && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                {item.status === 'error' && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
                <span className="text-sm truncate flex-1">{item.file.name}</span>
                {item.status === 'error' && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Retry upload"
                    onClick={() => runUpload(item)}>
                    <RotateCw className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Remove from queue"
                  onClick={() => setQueue((q) => q.filter((i) => i.id !== item.id))}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              {item.status !== 'error' && <Progress value={item.progress} className="h-1.5" />}
              {item.error && <p className="text-xs text-destructive">{item.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceUploader;
