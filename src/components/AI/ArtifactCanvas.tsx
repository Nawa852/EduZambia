import React, { useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code2, Eye, Download, Printer, FileText, RefreshCw, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface Artifact {
  title: string;
  kind: string;
  code: string;
  explanation?: string;
  steps?: string[];
}

const KIND_LABEL: Record<string, string> = {
  '3d': '3D scene',
  mindmap: 'Mind map',
  chart: 'Charts',
  diagram: 'Diagram',
  document: 'Document',
  simulation: 'Simulation',
};

/** Renders a generated self-contained HTML artifact in a sandboxed frame. */
export const ArtifactCanvas: React.FC<{
  artifact: Artifact;
  onRegenerate?: () => void;
  className?: string;
}> = ({ artifact, onRegenerate, className }) => {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [nonce, setNonce] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => artifact.code, [artifact.code]);

  const downloadHtml = () => {
    const blob = new Blob([artifact.code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/[^\w\d-]+/g, '-').toLowerCase() || 'artifact'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printArtifact = () => {
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Allow pop-ups to print or save as PDF.');
      return;
    }
    w.document.open();
    w.document.write(artifact.code);
    w.document.close();
    // Give CDN scripts/fonts a beat to paint before the print dialog.
    setTimeout(() => w.print(), 1200);
  };

  const downloadDocx = async () => {
    try {
      const [{ Document, Packer, Paragraph, HeadingLevel, TextRun }, { saveAs }] = await Promise.all([
        import('docx'),
        import('file-saver'),
      ]);
      const frameDoc = frameRef.current?.contentDocument;
      const bodyText = (frameDoc?.body?.innerText || artifact.explanation || '').trim();
      const paragraphs = bodyText
        .split(/\n{1,}/)
        .filter(Boolean)
        .map((line) => new Paragraph({ children: [new TextRun(line)] }));

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({ text: artifact.title, heading: HeadingLevel.HEADING_1 }),
              ...(paragraphs.length ? paragraphs : [new Paragraph('No extractable text content.')]),
            ],
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${artifact.title.replace(/[^\w\d-]+/g, '-').toLowerCase() || 'artifact'}.docx`);
    } catch {
      toast.error('Could not build the Word document.');
    }
  };

  const openFull = () => {
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Allow pop-ups to open full screen.');
      return;
    }
    w.document.open();
    w.document.write(artifact.code);
    w.document.close();
  };

  return (
    <Card className={cn('overflow-hidden rounded-2xl border-border/50', className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 bg-muted/30 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{artifact.title}</div>
          <Badge variant="secondary" className="mt-0.5 h-5 rounded-full text-[10px]">
            {KIND_LABEL[artifact.kind] ?? artifact.kind}
          </Badge>
        </div>
        <div className="inline-flex rounded-full bg-muted p-0.5">
          <button
            onClick={() => setTab('preview')}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition',
              tab === 'preview' ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          <button
            onClick={() => setTab('code')}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition',
              tab === 'code' ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
          >
            <Code2 className="h-3.5 w-3.5" /> Code
          </button>
        </div>
      </div>

      {tab === 'preview' ? (
        <iframe
          key={nonce}
          ref={frameRef}
          title={artifact.title}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-modals allow-popups"
          className="h-[420px] w-full bg-white sm:h-[520px]"
        />
      ) : (
        <pre className="max-h-[520px] overflow-auto bg-muted/40 p-4 text-[11px] leading-relaxed">
          <code>{artifact.code}</code>
        </pre>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border/50 px-3 py-2">
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setNonce((n) => n + 1)}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Rerun
        </Button>
        <Button size="sm" variant="outline" className="rounded-full" onClick={openFull}>
          <Maximize2 className="mr-1.5 h-3.5 w-3.5" /> Full screen
        </Button>
        <Button size="sm" variant="outline" className="rounded-full" onClick={printArtifact}>
          <Printer className="mr-1.5 h-3.5 w-3.5" /> PDF
        </Button>
        <Button size="sm" variant="outline" className="rounded-full" onClick={downloadDocx}>
          <FileText className="mr-1.5 h-3.5 w-3.5" /> Word
        </Button>
        <Button size="sm" variant="outline" className="rounded-full" onClick={downloadHtml}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> HTML
        </Button>
        {onRegenerate && (
          <Button size="sm" className="ml-auto rounded-full" onClick={onRegenerate}>
            Regenerate
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ArtifactCanvas;
