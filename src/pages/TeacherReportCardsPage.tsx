import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Printer, User, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';

interface StudentGrade { course_title: string; score: number | null; grade_letter: string | null; term: string | null; }

const TeacherReportCardsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data: courses, error } = await supabase.from('courses').select('id').eq('created_by', user.id);
      if (error) { toast.error('Failed to load courses'); setLoading(false); return; }
      if (!courses?.length) { setLoading(false); return; }
      const courseIds = courses.map(c => c.id) as string[];
      const { data: enrollments } = await supabase.from('enrollments').select('user_id').in('course_id', courseIds);
      const uniqueIds = [...new Set((enrollments || []).map(e => e.user_id))];
      if (!uniqueIds.length) { setLoading(false); return; }
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, grade').in('id', uniqueIds);
      setStudents(profiles || []);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedStudent) return;
    (async () => {
      const { data, error } = await (supabase as any).from('grades').select('score, grade_letter, term, course_id').eq('student_id', selectedStudent);
      if (error) { toast.error('Failed to load grades'); return; }
      if (data) {
        const courseIds = [...new Set(data.map((g: any) => g.course_id))] as string[];
        const { data: courses } = await supabase.from('courses').select('id, title').in('id', courseIds);
        const cMap = Object.fromEntries((courses || []).map(c => [c.id, c.title]));
        setGrades(data.map((g: any) => ({ ...g, course_title: cMap[g.course_id] || 'Unknown' })));
      }
    })();
  }, [selectedStudent]);

  const selectedProfile = students.find(s => s.id === selectedStudent);
  const avg = grades.length ? Math.round(grades.reduce((s, g) => s + (g.score || 0), 0) / grades.length) : 0;

  if (loading) return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          Report Card Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Generate and print professional report cards for your students</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <label className="text-sm font-medium text-foreground mb-1.5 block">Select Student</label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger><SelectValue placeholder="Choose a student..." /></SelectTrigger>
            <SelectContent>
              {students.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    <User className="w-3 h-3 text-muted-foreground" />
                    {s.full_name || 'Unnamed'} {s.grade ? `(${s.grade})` : ''}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!selectedStudent && (
        <Card>
          <CardContent className="py-16 text-center">
            <GraduationCap className="w-14 h-14 mx-auto mb-4 text-muted-foreground/20" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Select a student</h3>
            <p className="text-sm text-muted-foreground">Choose a student above to generate their report card</p>
          </CardContent>
        </Card>
      )}

      {selectedStudent && (
        <Card id="report-card">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{selectedProfile?.full_name || 'Student'}</CardTitle>
                  <CardDescription>Grade: {selectedProfile?.grade || 'N/A'}</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
                <Printer className="w-4 h-4" /> Print
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {grades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No grades recorded for this student.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Subject</TableHead>
                      <TableHead className="w-24 text-center">Score</TableHead>
                      <TableHead className="w-20 text-center">Grade</TableHead>
                      <TableHead className="w-24 text-center">Term</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((g, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                            {g.course_title}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{g.score ?? '—'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={g.grade_letter === 'A' || g.grade_letter === 'B' ? 'default' : g.grade_letter === 'F' ? 'destructive' : 'secondary'}>
                            {g.grade_letter || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground text-sm">{g.term || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    {grades.length} subject{grades.length !== 1 ? 's' : ''} recorded
                  </div>
                  <Badge className="text-sm px-4 py-1.5">{avg}% Average</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherReportCardsPage;
