import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTeacherStats } from '@/hooks/useTeacherStats';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { BookOpen, Save, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface StudentGrade {
  student_id: string;
  student_name: string;
  score: number | null;
  grade_letter: string | null;
  remarks: string;
  existing_grade_id: string | null;
}

export default function TeacherGradebookPage() {
  const { user } = useSecureAuth();
  const { courses, loading: coursesLoading } = useTeacherStats();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedCourse) fetchStudentGrades();
  }, [selectedCourse, selectedTerm]);

  const fetchStudentGrades = async () => {
    setLoading(true);
    try {
      // Get enrolled students
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('course_id', selectedCourse);

      if (!enrollments || enrollments.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = enrollments.map(e => e.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      // Get existing grades
      const { data: grades } = await supabase
        .from('grades')
        .select('id, student_id, score, grade_letter, remarks')
        .eq('course_id', selectedCourse)
        .eq('term', selectedTerm);

      const gradeMap: Record<string, typeof grades extends (infer T)[] | null ? T : never> = {};
      (grades || []).forEach(g => { gradeMap[g.student_id] = g; });

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.full_name || 'Unknown Student'; });

      setStudents(studentIds.map(id => ({
        student_id: id,
        student_name: nameMap[id] || 'Unknown Student',
        score: gradeMap[id]?.score ?? null,
        grade_letter: gradeMap[id]?.grade_letter ?? null,
        remarks: gradeMap[id]?.remarks ?? '',
        existing_grade_id: gradeMap[id]?.id ?? null,
      })));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const getGradeLetter = (score: number | null): string => {
    if (score === null) return '';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const updateScore = (idx: number, score: string) => {
    const num = score === '' ? null : Math.min(100, Math.max(0, parseInt(score) || 0));
    setStudents(prev => prev.map((s, i) => i === idx ? { ...s, score: num, grade_letter: getGradeLetter(num) } : s));
  };

  const updateRemarks = (idx: number, remarks: string) => {
    setStudents(prev => prev.map((s, i) => i === idx ? { ...s, remarks } : s));
  };

  const saveGrades = async () => {
    if (!user?.id || !selectedCourse) return;
    setSaving(true);
    try {
      for (const student of students) {
        if (student.score === null) continue;
        if (student.existing_grade_id) {
          await supabase.from('grades').update({
            score: student.score,
            grade_letter: student.grade_letter,
            remarks: student.remarks || null,
          }).eq('id', student.existing_grade_id);
        } else {
          await supabase.from('grades').insert({
            student_id: student.student_id,
            course_id: selectedCourse,
            score: student.score,
            grade_letter: student.grade_letter,
            remarks: student.remarks || null,
            term: selectedTerm,
            recorded_by: user.id,
          });
        }
      }
      toast.success('Grades saved successfully!');
      fetchStudentGrades();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  if (coursesLoading) return <div className="py-20"><LogoLoader size="lg" text="Loading..." /></div>;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          Gradebook
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Record and manage student grades</p>
      </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Term</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={saveGrades} disabled={saving || students.length === 0} className="w-full">
                  <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Grades'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {!selectedCourse ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Select a course</h3>
              <p className="text-muted-foreground">Choose a course above to view and enter student grades.</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <LogoLoader size="lg" text="Loading students..." />
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No students enrolled</h3>
              <p className="text-muted-foreground">This course has no enrolled students yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {courses.find(c => c.id === selectedCourse)?.title} — {selectedTerm}
              </CardTitle>
              <CardDescription>{students.length} student{students.length !== 1 ? 's' : ''} enrolled</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-24">Score (%)</TableHead>
                    <TableHead className="w-20">Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="w-16">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, idx) => (
                    <TableRow key={student.student_id}>
                      <TableCell className="font-medium text-foreground">{student.student_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={student.score ?? ''}
                          onChange={e => updateScore(idx, e.target.value)}
                          className="w-20"
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.grade_letter === 'A' || student.grade_letter === 'B' ? 'default' : student.grade_letter === 'F' ? 'destructive' : 'secondary'}>
                          {student.grade_letter || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={student.remarks}
                          onChange={e => updateRemarks(idx, e.target.value)}
                          placeholder="Optional remarks"
                          className="max-w-xs"
                        />
                      </TableCell>
                      <TableCell>
                        {student.existing_grade_id ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <span className="text-xs text-muted-foreground">New</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
