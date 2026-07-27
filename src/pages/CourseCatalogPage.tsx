import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, Filter, Plus, CheckCircle, Layers, ArrowRight,
  Users, Clock, Play, Sparkles, Download
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  thumbnail_url: string | null;
  created_by: string | null;
  is_published: boolean;
  created_at: string;
  lesson_count?: number;
  enrollment_count?: number;
  total_duration?: number;
  material_count?: number;
}

const subjectColors: Record<string, string> = {
  Mathematics: 'from-blue-500 to-cyan-500',
  English: 'from-purple-500 to-pink-500',
  Science: 'from-emerald-500 to-green-500',
  Physics: 'from-indigo-500 to-blue-500',
  Chemistry: 'from-orange-500 to-yellow-500',
  Biology: 'from-green-500 to-teal-500',
  Geography: 'from-amber-500 to-orange-500',
  History: 'from-rose-500 to-red-500',
  'Civic Education': 'from-violet-500 to-purple-500',
  'Computer Studies': 'from-slate-500 to-gray-500',
};

const subjectIcons: Record<string, string> = {
  Mathematics: '📐',
  English: '📝',
  Science: '🔬',
  Physics: '⚡',
  Chemistry: '🧪',
  Biology: '🧬',
  Geography: '🌍',
  History: '📜',
  'Civic Education': '🏛️',
  'Computer Studies': '💻',
};

const CourseCatalogPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (coursesData) {
      const courseIds = coursesData.map(c => c.id);
      
      // Fetch lessons, enrollments, and materials in parallel
      const [lessonsRes, enrollmentsCountRes, materialsRes] = await Promise.all([
        supabase.from('lessons').select('course_id, duration_minutes').in('course_id', courseIds.length ? courseIds : ['none']),
        supabase.from('enrollments').select('course_id').in('course_id', courseIds.length ? courseIds : ['none']),
        supabase.from('course_materials').select('course_id').in('course_id', courseIds.length ? courseIds : ['none']),
      ]);

      const lessonCounts: Record<string, number> = {};
      const totalDurations: Record<string, number> = {};
      lessonsRes.data?.forEach(l => {
        lessonCounts[l.course_id] = (lessonCounts[l.course_id] || 0) + 1;
        totalDurations[l.course_id] = (totalDurations[l.course_id] || 0) + (l.duration_minutes || 0);
      });

      const enrollCounts: Record<string, number> = {};
      enrollmentsCountRes.data?.forEach(e => {
        enrollCounts[e.course_id] = (enrollCounts[e.course_id] || 0) + 1;
      });

      const materialCounts: Record<string, number> = {};
      (materialsRes.data || []).forEach((m: any) => {
        materialCounts[m.course_id] = (materialCounts[m.course_id] || 0) + 1;
      });

      setCourses(coursesData.map(c => ({
        ...c,
        lesson_count: lessonCounts[c.id] || 0,
        total_duration: totalDurations[c.id] || 0,
        enrollment_count: enrollCounts[c.id] || 0,
        material_count: materialCounts[c.id] || 0,
      })));
    }

    if (user) {
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id);
      if (enrollData) setEnrollments(new Set(enrollData.map(e => e.course_id)));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSeedCourses = async () => {
    if (!user) { toast.error('Please sign in first'); return; }
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-ecz-courses');
      if (error) throw error;
      toast.success(data?.message || 'ECZ courses loaded!');
      await fetchData();
    } catch (err: any) {
      toast.error('Failed to load ECZ courses');
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) { toast.error('Please sign in to enroll'); return; }
    setEnrolling(true);
    const { error } = await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId });
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Already enrolled!' : 'Failed to enroll');
    } else {
      setEnrollments(prev => new Set([...prev, courseId]));
      toast.success('Successfully enrolled!');
    }
    setEnrolling(false);
    setSelectedCourse(null);
  };

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = subjectFilter === 'all' || c.subject === subjectFilter;
    const matchGrade = gradeFilter === 'all' || c.grade_level === gradeFilter;
    return matchSearch && matchSubject && matchGrade;
  });

  const uniqueSubjects = [...new Set(courses.map(c => c.subject).filter(Boolean))];
  const uniqueGrades = [...new Set(courses.map(c => c.grade_level).filter(Boolean))];

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="w-full py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Course Catalog
          </h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} ECZ-aligned courses • {courses.reduce((sum, c) => sum + (c.lesson_count || 0), 0)} video lessons
          </p>
        </div>
        <div className="flex gap-2">
          {courses.length === 0 && !loading && (
            <Button variant="outline" onClick={handleSeedCourses} disabled={seeding} className="gap-2">
              <Download className="w-4 h-4" />
              {seeding ? 'Loading ECZ Courses...' : 'Load ECZ Courses'}
            </Button>
          )}
          <Button onClick={() => navigate('/create-course')}>
            <Plus className="w-4 h-4 mr-2" /> Create Course
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search courses..." className="pl-9" />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {uniqueSubjects.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Grade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {uniqueGrades.map(g => <SelectItem key={g!} value={g!}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Subject quick filter chips */}
      {uniqueSubjects.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {uniqueSubjects.map(s => (
            <button
              key={s!}
              onClick={() => setSubjectFilter(subjectFilter === s ? 'all' : s!)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                subjectFilter === s
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <span>{subjectIcons[s!] || '📚'}</span>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-0">
                <div className="h-36 bg-muted rounded-t-lg" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-primary/40" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {courses.length === 0 ? 'No courses yet' : 'No matching courses'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            {courses.length === 0
              ? 'Get started by loading the ECZ curriculum courses with YouTube video lessons, or create your own course.'
              : 'Try adjusting your filters or search query.'}
          </p>
          {courses.length === 0 && (
            <div className="flex gap-3 justify-center">
              <Button onClick={handleSeedCourses} disabled={seeding} className="gap-2">
                <Sparkles className="w-4 h-4" />
                {seeding ? 'Loading...' : 'Load ECZ Courses'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/create-course')}>
                <Plus className="w-4 h-4 mr-2" /> Create Your Own
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course, i) => {
            const isEnrolled = enrollments.has(course.id);
            const gradient = subjectColors[course.subject || ''] || 'from-primary to-accent';
            const icon = subjectIcons[course.subject || ''] || '📚';
            return (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card
                  className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => isEnrolled ? navigate(`/course/${course.id}`) : setSelectedCourse(course)}
                >
                  <div className={`h-32 bg-gradient-to-br ${gradient} relative flex flex-col justify-between p-4`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="relative z-10 flex items-start justify-between">
                      <span className="text-2xl">{icon}</span>
                      {isEnrolled && (
                        <div className="bg-white/90 rounded-full p-1">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                      )}
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                      {course.subject && <Badge className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">{course.subject}</Badge>}
                      {course.grade_level && <Badge className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">{course.grade_level}</Badge>}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 text-sm">
                      {course.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {course.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3" /> {course.lesson_count} lessons
                      </span>
                      {course.total_duration ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDuration(course.total_duration)}
                        </span>
                      ) : null}
                      {(course.material_count || 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" /> {course.material_count} papers
                        </span>
                      )}
                      <span className="flex items-center gap-1 ml-auto">
                        <Users className="w-3 h-3" /> {course.enrollment_count}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Enroll Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        {selectedCourse && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-xl">{subjectIcons[selectedCourse.subject || ''] || '📚'}</span>
                {selectedCourse.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap gap-2">
                {selectedCourse.subject && <Badge variant="secondary">{selectedCourse.subject}</Badge>}
                {selectedCourse.grade_level && <Badge variant="outline">{selectedCourse.grade_level}</Badge>}
                <Badge variant="outline"><Play className="w-3 h-3 mr-1" /> {selectedCourse.lesson_count} lessons</Badge>
                {selectedCourse.total_duration ? (
                  <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> {formatDuration(selectedCourse.total_duration)}</Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">{selectedCourse.description || 'No description available.'}</p>
              
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm">What you'll get:</p>
                <ul className="space-y-1">
                  <li>• {selectedCourse.lesson_count} structured video lessons</li>
                  <li>• ECZ-aligned curriculum content</li>
                  <li>• Progress tracking & completion certificates</li>
                  <li>• YouTube-based learning resources</li>
                </ul>
              </div>

              {enrollments.has(selectedCourse.id) ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">You're enrolled in this course</span>
                </div>
              ) : (
                <Button className="w-full" onClick={() => handleEnroll(selectedCourse.id)} disabled={enrolling}>
                  {enrolling ? 'Enrolling...' : 'Enroll Now – Free'} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default CourseCatalogPage;
