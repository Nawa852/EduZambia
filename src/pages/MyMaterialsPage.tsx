import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { useTeachingResources } from '@/hooks/useTeachingResources';
import { FolderUp, Upload, Trash2, FileText, Sparkles } from 'lucide-react';

/**
 * Personal materials uploader for any user (students + teachers).
 * Stored as private teaching_resources. Used by the AI tutor for personalization.
 */
const MyMaterialsPage = () => {
  const { items, loading, create, remove, uploadFile } = useTeachingResources({ scope: 'mine' });
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const personalItems = items.filter(i => i.resource_type === 'other' || i.visibility === 'private');

  const submit = async () => {
    if (!file && !title.trim()) return;
    setBusy(true);
    const url = file ? await uploadFile(file, 'materials') : null;
    await create({
      title: title.trim() || file?.name || 'Personal material',
      description: notes,
      resource_type: 'other',
      visibility: 'private',
      file_url: url,
    });
    setBusy(false);
    setTitle(''); setNotes(''); setFile(null);
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <PageHeader
        title="My Personal Materials"
        subtitle="Upload your study PDFs, textbooks, lecture slides, or any document. The AI tutor will use these for personalized explanations and quizzes."
        icon={FolderUp}
      />

      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="pt-6 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Files here are <strong>private to you</strong>. Once uploaded, the BrightSphere AI tutor can reference them
            when you ask questions, generate practice quizzes from them, or summarize them on demand.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Add a new material</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Title (optional — defaults to file name)" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Notes — what's this about? Helps the AI find it later." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          <Button onClick={submit} disabled={busy || (!file && !title.trim())}>
            <Upload className="w-4 h-4 mr-2" /> {busy ? 'Uploading…' : 'Upload'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your library ({personalItems.length})</h2>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
          personalItems.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              No materials yet. Upload your first file above.
            </CardContent></Card>
          ) : personalItems.map(m => (
            <Card key={m.id}>
              <CardContent className="pt-6 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{m.title}</p>
                  {m.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.description}</p>}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">Private</Badge>
                    {m.file_url && <a href={m.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open file</a>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))
        }
      </div>
    </div>
  );
};

export default MyMaterialsPage;
