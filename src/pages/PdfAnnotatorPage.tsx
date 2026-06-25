import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Highlighter, MessageSquarePlus, Download, Upload, ChevronLeft, ChevronRight, Trash2, FileText } from 'lucide-react';

type Anno = {
  id: string;
  page: number;
  // normalized 0..1
  x: number; y: number; w: number; h: number;
  color: string;
  note?: string;
};

export default function PdfAnnotatorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState('document.pdf');
  const [annos, setAnnos] = useState<Anno[]>([]);
  const [tool, setTool] = useState<'highlight' | 'comment' | 'pan'>('highlight');
  const [color, setColor] = useState('#fde047');
  const [drag, setDrag] = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const [scale, setScale] = useState(1.25);
  const [renderSize, setRenderSize] = useState({ w: 0, h: 0 });

  // load pdfjs worker
  useEffect(() => {
    (async () => {
      const pdfjs = await import('pdfjs-dist');
      // @ts-ignore
      pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    })();
  }, []);

  async function openFile(f: File) {
    const buf = new Uint8Array(await f.arrayBuffer());
    setFileBytes(buf);
    setFileName(f.name);
    const pdfjs = await import('pdfjs-dist');
    const doc = await pdfjs.getDocument({ data: buf.slice() }).promise;
    setPdfDoc(doc);
    setPageCount(doc.numPages);
    setPage(1);
    setAnnos([]);
  }

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    (async () => {
      const p = await pdfDoc.getPage(page);
      const viewport = p.getViewport({ scale });
      const canvas = canvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setRenderSize({ w: viewport.width, h: viewport.height });
      const ctx = canvas.getContext('2d')!;
      await p.render({ canvasContext: ctx, viewport, canvas }).promise;
    })();
  }, [pdfDoc, page, scale]);

  const onDown = (e: React.MouseEvent) => {
    if (tool === 'pan' || !overlayRef.current) return;
    const r = overlayRef.current.getBoundingClientRect();
    setDrag({ sx: e.clientX - r.left, sy: e.clientY - r.top, ex: e.clientX - r.left, ey: e.clientY - r.top });
  };
  const onMove = (e: React.MouseEvent) => {
    if (!drag || !overlayRef.current) return;
    const r = overlayRef.current.getBoundingClientRect();
    setDrag({ ...drag, ex: e.clientX - r.left, ey: e.clientY - r.top });
  };
  const onUp = () => {
    if (!drag) return;
    const w = Math.abs(drag.ex - drag.sx), h = Math.abs(drag.ey - drag.sy);
    if (w < 4 || h < 4) { setDrag(null); return; }
    const x = Math.min(drag.sx, drag.ex), y = Math.min(drag.sy, drag.ey);
    const id = crypto.randomUUID();
    const note = tool === 'comment' ? (prompt('Add a comment') || '') : undefined;
    setAnnos(a => [...a, {
      id, page,
      x: x / renderSize.w, y: y / renderSize.h, w: w / renderSize.w, h: h / renderSize.h,
      color, note,
    }]);
    setDrag(null);
  };

  async function exportPdf() {
    if (!fileBytes) { toast.error('Open a PDF first'); return; }
    const { PDFDocument, rgb } = await import('pdf-lib');
    const doc = await PDFDocument.load(fileBytes.slice());
    const pages = doc.getPages();
    const hexToRgb = (hex: string) => {
      const v = hex.replace('#', '');
      const n = parseInt(v.length === 3 ? v.split('').map(c => c + c).join('') : v, 16);
      return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
    };
    annos.forEach(a => {
      const p = pages[a.page - 1];
      if (!p) return;
      const { width, height } = p.getSize();
      p.drawRectangle({
        x: a.x * width,
        y: height - (a.y + a.h) * height,
        width: a.w * width,
        height: a.h * height,
        color: hexToRgb(a.color),
        opacity: 0.35,
      });
      if (a.note) {
        p.drawText(`💬 ${a.note}`.slice(0, 80), {
          x: a.x * width + 2,
          y: height - (a.y + a.h) * height - 10,
          size: 8,
          color: rgb(0.1, 0.1, 0.1),
        });
      }
    });
    const out = await doc.save();
    const blob = new Blob([out as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName.replace(/\.pdf$/i, '') + '-annotated.pdf';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Annotated PDF exported');
  }

  const removeAnno = (id: string) => setAnnos(a => a.filter(x => x.id !== id));

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 max-w-7xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-primary" /> PDF Annotator</h1>
        <p className="text-sm text-muted-foreground">Highlight, comment and export annotated PDFs.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <Card className="p-3 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <label className="inline-flex">
              <input type="file" accept="application/pdf" hidden onChange={e => e.target.files?.[0] && openFile(e.target.files[0])} />
              <Button size="sm" variant="outline" asChild><span><Upload className="w-3.5 h-3.5 mr-1.5" /> Open PDF</span></Button>
            </label>
            <div className="h-6 w-px bg-border" />
            <Button size="sm" variant={tool === 'highlight' ? 'default' : 'outline'} onClick={() => setTool('highlight')}>
              <Highlighter className="w-3.5 h-3.5 mr-1.5" /> Highlight
            </Button>
            <Button size="sm" variant={tool === 'comment' ? 'default' : 'outline'} onClick={() => setTool('comment')}>
              <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5" /> Comment
            </Button>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded-md border" title="Color" />
            <div className="h-6 w-px bg-border" />
            <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-xs font-medium">{page} / {pageCount || '–'}</span>
            <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(pageCount, p + 1))}><ChevronRight className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setScale(s => Math.max(0.5, s - 0.25))}>−</Button>
            <Button size="sm" variant="ghost" onClick={() => setScale(s => Math.min(3, s + 0.25))}>+</Button>
            <div className="flex-1" />
            <Button size="sm" onClick={exportPdf}><Download className="w-3.5 h-3.5 mr-1.5" /> Export</Button>
          </div>

          <div className="relative bg-muted/30 rounded-xl overflow-auto max-h-[78vh] flex items-start justify-center p-3">
            {!pdfDoc && (
              <div className="text-center text-sm text-muted-foreground py-24">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                Open a PDF to start annotating
              </div>
            )}
            <div className="relative" style={{ width: renderSize.w, height: renderSize.h }}>
              <canvas ref={canvasRef} className="block shadow-elevated rounded-md" />
              <div
                ref={overlayRef}
                className="absolute inset-0 cursor-crosshair"
                onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
              >
                {annos.filter(a => a.page === page).map(a => (
                  <div key={a.id}
                    className="absolute group"
                    style={{ left: a.x * renderSize.w, top: a.y * renderSize.h, width: a.w * renderSize.w, height: a.h * renderSize.h, backgroundColor: a.color, opacity: 0.4 }}
                    title={a.note || ''}
                  >
                    {a.note && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center">💬</div>
                    )}
                  </div>
                ))}
                {drag && (
                  <div className="absolute border-2 border-primary/50"
                    style={{
                      left: Math.min(drag.sx, drag.ex), top: Math.min(drag.sy, drag.ey),
                      width: Math.abs(drag.ex - drag.sx), height: Math.abs(drag.ey - drag.sy),
                      backgroundColor: color, opacity: 0.35,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl h-fit">
          <div className="font-semibold text-sm mb-3">Annotations ({annos.length})</div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {annos.length === 0 && <div className="text-xs text-muted-foreground">Drag on the page to highlight or comment.</div>}
            {annos.map(a => (
              <div key={a.id} className="p-2.5 rounded-lg border border-border/40 bg-card">
                <div className="flex items-center justify-between mb-1">
                  <button onClick={() => setPage(a.page)} className="text-[11px] font-medium text-primary hover:underline">Page {a.page}</button>
                  <button onClick={() => removeAnno(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: a.color }} />
                  {a.note ? (
                    <Textarea
                      className="text-xs min-h-[40px] resize-none"
                      value={a.note}
                      onChange={e => setAnnos(prev => prev.map(x => x.id === a.id ? { ...x, note: e.target.value } : x))}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Highlight</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
