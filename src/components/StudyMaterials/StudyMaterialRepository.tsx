import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Search, Download, FileText, Video, Image, Music } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StudyMaterial {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  subject: string | null;
  grade: string | null;
  curriculum: string | null;
  upload_date: string | null;
  user_id: string | null;
  file_size: number | null;
  metadata: any;
}

const StudyMaterialRepository = () => {
  const [materials] = useState<StudyMaterial[]>([
    { id: '1', file_name: 'Grade 12 Mathematics Notes.pdf', file_path: '/materials/math.pdf', file_type: 'application/pdf', subject: 'Mathematics', grade: '12', curriculum: 'ECZ', upload_date: new Date().toISOString(), user_id: '1', file_size: 2048000, metadata: {} },
    { id: '2', file_name: 'Physics Formulas.pdf', file_path: '/materials/physics.pdf', file_type: 'application/pdf', subject: 'Physics', grade: '12', curriculum: 'ECZ', upload_date: new Date().toISOString(), user_id: '1', file_size: 1024000, metadata: {} },
    { id: '3', file_name: 'Chemistry Lab Guide.pdf', file_path: '/materials/chemistry.pdf', file_type: 'application/pdf', subject: 'Chemistry', grade: '11', curriculum: 'ECZ', upload_date: new Date().toISOString(), user_id: '1', file_size: 3072000, metadata: {} },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-6 w-6" />;
    
    if (fileType.startsWith('video/')) return <Video className="h-6 w-6 text-red-500" />;
    if (fileType.startsWith('image/')) return <Image className="h-6 w-6 text-green-500" />;
    if (fileType.startsWith('audio/')) return <Music className="h-6 w-6 text-purple-500" />;
    return <FileText className="h-6 w-6 text-blue-500" />;
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || material.subject === selectedSubject;
    const matchesGrade = selectedGrade === 'all' || material.grade === selectedGrade;
    
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const subjects = [...new Set(materials.map(m => m.subject).filter(Boolean))];
  const grades = [...new Set(materials.map(m => m.grade).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Study Materials Repository
            </CardTitle>
            <CardDescription>
              Access and manage your study materials
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject || ''}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade || ''}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(material.file_type)}
                    <div>
                      <CardTitle className="text-lg">{material.file_name}</CardTitle>
                      <CardDescription>
                        {material.subject && (
                          <Badge variant="secondary" className="mr-2">
                            {material.subject}
                          </Badge>
                        )}
                        {material.grade && (
                          <Badge variant="outline">
                            Grade {material.grade}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Curriculum:</span>
                    <span>{material.curriculum || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Size:</span>
                    <span>{material.file_size ? `${Math.round(material.file_size / 1024)} KB` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Uploaded:</span>
                    <span>{material.upload_date ? new Date(material.upload_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMaterials.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No materials found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudyMaterialRepository;
