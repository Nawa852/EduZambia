import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Eye, BookOpen, FileText, Video, Image, Upload } from 'lucide-react';
import { DocumentScanner } from '@/components/Camera/DocumentScanner';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudyMaterial {
  id: string;
  file_name: string;
  file_path: string;
  subject: string;
  grade: string;
  file_type: string;
  upload_date: string;
  file_size: number | null;
}

const StudyMaterialsPage = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = [
    'Mathematics', 'English', 'Science', 'Social Studies', 'Civic Education',
    'Geography', 'History', 'Biology', 'Chemistry', 'Physics',
    'Computer Studies', 'Agriculture', 'Business Studies', 'Art'
  ];

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-primary" />;
    if (fileType?.includes('video')) return <Video className="w-5 h-5 text-primary" />;
    if (fileType?.includes('image')) return <Image className="w-5 h-5 text-primary" />;
    return <BookOpen className="w-5 h-5 text-muted-foreground" />;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `study-materials/${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath);

      const newMaterial: StudyMaterial = {
        id: Date.now().toString(),
        file_name: file.name,
        file_path: publicUrl,
        subject: subjectFilter !== 'all' ? subjectFilter : 'General',
        grade: 'All',
        file_type: file.type,
        upload_date: new Date().toISOString(),
        file_size: file.size,
      };

      setMaterials(prev => [newMaterial, ...prev]);
      toast.success(`${file.name} uploaded successfully!`);
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchSearch = m.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = subjectFilter === 'all' || m.subject === subjectFilter;
    return matchSearch && matchSubject;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full space-y-6">
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-3xl">
              <BookOpen className="w-8 h-8" />
              Study Materials Repository
            </CardTitle>
            <p className="text-primary-foreground/80">
              Upload, scan, and access study materials
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search materials..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <div>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png,.jpeg" onChange={handleFileUpload} className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full">
                  <Upload className="w-4 h-4 mr-2" /> {uploading ? 'Uploading...' : 'Upload File'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <DocumentScanner onUploadComplete={(url, name) => {
              setMaterials(prev => [{
                id: Date.now().toString(),
                file_name: name,
                file_path: url,
                subject: 'General',
                grade: 'All',
                file_type: 'image/jpeg',
                upload_date: new Date().toISOString(),
                file_size: null,
              }, ...prev]);
              toast.success(`${name} scanned and uploaded!`);
            }} />
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMaterials.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No materials yet</h3>
                <p className="text-muted-foreground">Upload files or scan documents to get started</p>
              </div>
            ) : (
              filteredMaterials.map(material => (
                <Card key={material.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      {getFileIcon(material.file_type)}
                      <Badge variant="outline" className="text-xs">{material.subject}</Badge>
                    </div>
                    <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2">{material.file_name}</h3>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="secondary" className="text-xs">{material.grade}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      {new Date(material.upload_date).toLocaleDateString()}
                      {material.file_size && ` · ${(material.file_size / 1024 / 1024).toFixed(1)} MB`}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(material.file_path, '_blank')}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => window.open(material.file_path, '_blank')}>
                        <Download className="w-4 h-4 mr-1" /> Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
