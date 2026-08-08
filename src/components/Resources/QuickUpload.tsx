import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, FolderPlus, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useResources } from '@/hooks/useResources';
import { validateFile, type ResourcePermissions } from '@/lib/resourcePermissions';
import { detectKind } from '@/lib/resourceRepository';

interface Props {
  perms: ResourcePermissions;
  role: string | null;
  /** Files land straight in this folder when set. */
  folder?: string | null;
  subject?: string | null;
  compact?: boolean;
  onUploaded?: () => void;
}

/**
 * One-tap upload. No forms, no required metadata — drop files and they are
 * stored, filed and available across the app immediately.
 */
export const QuickUpload: React.FC<Props> = ({ perms, role, folder, subject, compact, onUploaded }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, createFolder } = useResources();
  const [dragOver, setDragOver] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const [showFolder, setShowFolder] = useState(false);
  const busy = upload.isPending;

  const send = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    if (!perms.canUpload) { toast.error('Your account cannot upload resources'); return; }

    const files: File[] = [];
    for (const file of Array.from(fileList)) {
      const check = validateFile(file, perms, detectKind(file));
      if (!check.ok) { toast.error(`${file.name}: ${check.reason}`); continue; }
      files.push(file);
    }
    if (!files.length) return;

    const toastId = toast.loading(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}…`);
    const { uploaded, failed } = await upload.mutateAsync({
      files, role, subject: subject ?? null, folderPath: folder ?? null, source: 'quick-upload',
    });
    toast.dismiss(toastId);
    if (uploaded.length) toast.success(`${uploaded.length} file${uploaded.length > 1 ? 's' : ''} added`);
    if (failed.length) toast.error(`${failed.length} failed: ${failed[0].error.message}`);
    onUploaded?.();
  };

  const makeFolder = () => {
    const created = createFolder(newFolder);
    if (!created) { toast.error('Give the folder a name'); return; }
    toast.success(`Folder “${created}” created`);
    setNewFolder('');
    setShowFolder(false);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); void send(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        role="button"
        tabIndex={0}
        aria-label="Upload files"
        className={`rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors ${
          compact ? 'p-4' : 'p-7'
        } ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/20'}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { void send(e.target.files); e.target.value = ''; }}
        />
        {busy
          ? <Loader2 className="w-7 h-7 mx-auto text-primary animate-spin" />
          : <UploadCloud className="w-7 h-7 mx-auto text-primary" />}
        <p className="mt-2 text-sm font-medium">
          {busy ? 'Uploading…' : 'Drop files here or tap to upload'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Add as many as you like{folder ? ` → ${folder}` : ''}. Max {perms.maxSizeMb}MB each.
        </p>
      </div>

      {showFolder ? (
        <div className="flex gap-2">
          <Input
            autoFocus
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') makeFolder(); if (e.key === 'Escape') setShowFolder(false); }}
            placeholder="Folder name"
            aria-label="New folder name"
            className="rounded-xl h-9"
          />
          <Button size="sm" className="rounded-xl h-9" onClick={makeFolder}>
            <Check className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="rounded-xl h-8 text-xs text-muted-foreground"
          onClick={() => setShowFolder(true)}
        >
          <FolderPlus className="w-3.5 h-3.5 mr-1.5" /> New folder
        </Button>
      )}
    </div>
  );
};

export default QuickUpload;
