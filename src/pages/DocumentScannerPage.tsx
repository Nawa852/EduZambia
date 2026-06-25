import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Camera, Upload, ScanLine, Trash2, Save, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

type Page = { id: string; dataUrl: string; text: string; ocrProgress: number; ocrDone: boolean };

const OCR_LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'eng+bem', label: 'Bemba + English' },
  { code: 'eng+nya', label: 'Nyanja (Chichewa) + English' },
  { code: 'eng+toi', label: 'Tonga + English' },
  { code: 'eng+loz', label: 'Lozi + English' },
  { code: 'eng+fra', label: 'English + French' },
  { code: 'eng+por', label: 'English + Portuguese' },
];

export default function DocumentScannerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [title, setTitle] = useState('Scanned Note');
  const [folder, setFolder] = useState('Scans');
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState('eng');

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch (e: any) {
      toast.error(e.message || 'Could not access camera');
    }
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function capture() {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d')!;
    // light contrast enhancement
    ctx.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.92);
    addPage(dataUrl);
  }

  async function onFiles(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const r = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(f);
      });
      addPage(r);
    }
  }

  function addPage(dataUrl: string) {
    const id = crypto.randomUUID();
    setPages(p => [...p, { id, dataUrl, text: '', ocrProgress: 0, ocrDone: false }]);
    runOcr(id, dataUrl);
  }

  async function runOcr(id: string, dataUrl: string) {
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const { data } = await Tesseract.recognize(dataUrl, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setPages(prev => prev.map(p => p.id === id ? { ...p, ocrProgress: Math.round(m.progress * 100) } : p));
          }
        },
      });
      setPages(prev => prev.map(p => p.id === id ? { ...p, text: data.text.trim(), ocrDone: true, ocrProgress: 100 } : p));
    } catch (e: any) {
      toast.error('OCR failed: ' + (e.message || ''));
      setPages(prev => prev.map(p => p.id === id ? { ...p, ocrDone: true } : p));
    }
  }

  function removePage(id: string) {
    setPages(p => p.filter(x => x.id !== id));
  }

  async function saveAsNote() {
    if (!user) { toast.error('Please sign in'); return; }
    if (pages.length === 0) { toast.error('Scan something first'); return; }
    setSaving(true);
    const html = pages.map((p, i) => `
      <h3>Page ${i + 1}</h3>
      <img src="${p.dataUrl}" style="max-width:100%;border-radius:8px;margin:8px 0" />
      <pre style="white-space:pre-wrap;font-family:inherit">${(p.text || '').replace(/</g, '&lt;')}</pre>
    `).join('<hr/>');
    const content = `<div data-folder="${folder}">${html}</div>`;
    const { error } = await supabase.from('student_notes').insert({
      user_id: user.id,
      title: title || 'Scanned Note',
      content,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Saved to your notes');
    navigate('/student-notes');
  }

  const combinedText = pages.map((p, i) => `--- Page ${i + 1} ---\n${p.text}`).join('\n\n');

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 max-w-6xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ScanLine className="w-6 h-6 text-primary" /> Document Scanner</h1>
        <p className="text-sm text-muted-foreground">Capture pages, extract text with OCR, save to your notes.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <Card className="p-4 rounded-2xl">
          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/90 relative flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`} />
            {!cameraOn && (
              <div className="text-center text-white/80 text-sm">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-70" />
                Camera off
              </div>
            )}
            {cameraOn && (
              <div className="absolute inset-6 border-2 border-dashed border-white/40 rounded-xl pointer-events-none" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {!cameraOn ? (
              <Button onClick={startCamera}><Camera className="w-4 h-4 mr-1.5" /> Start Camera</Button>
            ) : (
              <>
                <Button onClick={capture}><ScanLine className="w-4 h-4 mr-1.5" /> Capture Page</Button>
                <Button variant="outline" onClick={stopCamera}>Stop</Button>
              </>
            )}
            <label className="inline-flex">
              <input type="file" accept="image/*" hidden multiple onChange={e => onFiles(e.target.files)} />
              <Button variant="outline" asChild><span><Upload className="w-4 h-4 mr-1.5" /> Upload images</span></Button>
            </label>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">{pages.length} page{pages.length === 1 ? '' : 's'}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pages.map((p, i) => (
              <div key={p.id} className="rounded-lg border border-border/40 overflow-hidden bg-card">
                <div className="relative aspect-[3/4] bg-muted">
                  <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePage(p.id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="absolute top-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Page {i + 1}</div>
                </div>
                <div className="p-2 text-[11px]">
                  {p.ocrDone ? (
                    <span className="text-emerald-600 font-medium">✓ OCR done</span>
                  ) : (
                    <span className="text-muted-foreground inline-flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> OCR {p.ocrProgress}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 rounded-2xl h-fit">
          <div className="font-semibold text-sm mb-3">Save to Notes</div>
          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] text-muted-foreground">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Folder / Tag</label>
              <Input value={folder} onChange={e => setFolder(e.target.value)} placeholder="Scans" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Extracted Text</label>
              <Textarea className="min-h-[180px] text-xs" value={combinedText} readOnly placeholder="OCR text will appear here..." />
            </div>
            <Button className="w-full" onClick={saveAsNote} disabled={saving || pages.length === 0}>
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save to Rich Text Notes
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(combinedText); toast.success('Text copied'); }}>
              Copy text
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
