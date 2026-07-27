import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Upload, RotateCcw, Check, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import SynapseLogo from '@/assets/edu-zambia-logo.svg';

interface DocumentScannerProps {
  onUploadComplete?: (url: string, fileName: string) => void;
}

const subjects = [
  'Mathematics', 'English', 'Science', 'Biology', 'Chemistry', 'Physics',
  'Geography', 'History', 'Civic Education', 'Computer Studies',
];

const grades = [
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

export function DocumentScanner({ onUploadComplete }: DocumentScannerProps) {
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview' | 'uploading'>('idle');
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMode('camera');
    } catch (err) {
      toast({ title: 'Camera Error', description: 'Unable to access camera. Please check permissions.', variant: 'destructive' });
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        setCapturedImage(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setMode('preview');
        stopCamera();
      }
    }, 'image/jpeg', 0.92);
  }, [stopCamera]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => startCamera(), 100);
  }, [stopCamera, startCamera]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name.replace(/\.[^/.]+$/, ''));
    setMode('preview');
  }, []);

  const retake = useCallback(() => {
    setCapturedImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMode('idle');
  }, [previewUrl]);

  const uploadDocument = useCallback(async () => {
    if (!capturedImage || !user) return;
    if (!fileName.trim()) {
      toast({ title: 'Name required', description: 'Please give your document a name.', variant: 'destructive' });
      return;
    }

    setMode('uploading');
    try {
      const ext = capturedImage.type.includes('pdf') ? 'pdf' : 'jpg';
      const path = `${user.id}/${Date.now()}-${fileName.replace(/\s+/g, '_')}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(path, capturedImage, { contentType: capturedImage.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);

      toast({ title: 'Uploaded!', description: `"${fileName}" saved successfully.` });
      onUploadComplete?.(publicUrl, fileName);
      retake();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      setMode('preview');
    }
  }, [capturedImage, user, fileName, toast, onUploadComplete, retake]);

  const close = useCallback(() => {
    stopCamera();
    retake();
    setMode('idle');
  }, [stopCamera, retake]);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
            <img src={SynapseLogo} alt="" className="w-6 h-6" />
          </div>
          Scan & Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {mode === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={startCamera} className="h-24 flex-col gap-2 bg-gradient-to-br from-primary to-accent text-primary-foreground hover:opacity-90">
                  <Camera className="w-8 h-8" />
                  <span className="text-sm font-medium">Open Camera</span>
                </Button>
                <label className="cursor-pointer">
                  <div className="h-24 flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Upload File</span>
                  </div>
                  <input type="file" accept="image/*,.pdf" capture="environment" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Scan documents, notes, or past papers with your camera or upload from gallery
              </p>
            </motion.div>
          )}

          {mode === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {/* Scan overlay guides */}
                <div className="absolute inset-4 border-2 border-white/30 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="text-xs text-white/70 bg-black/40 px-3 py-1 rounded-full">Align document within frame</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" onClick={close} className="h-12 w-12 rounded-full">
                  <X className="w-5 h-5" />
                </Button>
                <Button onClick={capturePhoto} className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                  <Camera className="w-7 h-7 text-primary-foreground" />
                </Button>
                <Button variant="outline" size="icon" onClick={switchCamera} className="h-12 w-12 rounded-full">
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {(mode === 'preview' || mode === 'uploading') && previewUrl && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3]">
                <img src={previewUrl} alt="Captured" className="w-full h-full object-contain" />
                <div className="absolute top-2 right-2">
                  <Button variant="secondary" size="icon" onClick={retake} className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Document Name *</Label>
                  <Input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g. Biology Notes Chapter 3" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Grade</Label>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={retake} className="flex-1" disabled={mode === 'uploading'}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Retake
                  </Button>
                  <Button onClick={uploadDocument} className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground" disabled={mode === 'uploading'}>
                    {mode === 'uploading' ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Upload className="w-4 h-4 mr-2" />
                      </motion.div>
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    {mode === 'uploading' ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
