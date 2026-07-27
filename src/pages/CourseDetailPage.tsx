import { useState, useEffect } from 'react';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen, ArrowLeft, Play, FileText, Clock, CheckCircle,
  ChevronRight, Layers, Lock, ClipboardCheck, StickyNote, Save, Users,
  Download, FileDown, BookMarked, ExternalLink, Brain, Sparkles, Loader2
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  order_index: number;
}

interface CourseMaterial {
  id: string;
  title: string;
  url: string;
  type: string;
  year: string | null;
  paper: string | null;
}

interface CourseAssessment {
  id: string;
  title: string;
  assessment_type: string;
  question_count: number;
  time_limit_minutes: number | null;
  pass_threshold: number;
  is_active: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  created_by: string | null;
}

interface EnrolledStudent {
  user_id: string;
  full_name: string;
  progress: number;
  enrolled_at: string;
}

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [assessments, setAssessments] = useState<CourseAssessment[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('lessons');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    const fetchData = async () => {
      const [{ data: courseData }, { data: lessonsData }, { data: materialsData }, { data: assessmentsData }] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).single(),
        supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index'),
        supabase.from('course_materials').select('*').eq('course_id', courseId).order('created_at'),
        supabase.from('course_assessments').select('*').eq('course_id', courseId).eq('is_active', true),
      ]);

      if (courseData) {
        setCourse(courseData);
        if (user && courseData.created_by === user.id) setIsCreator(true);
      }
      if (lessonsData) {
        setLessons(lessonsData);
        if (lessonsData.length > 0) setActiveLesson(lessonsData[0]);
      }
      if (materialsData) setMaterials(materialsData as CourseMaterial[]);
      if (assessmentsData) setAssessments(assessmentsData as CourseAssessment[]);

      if (user) {
        const [{ data: enrollment }, { data: completions }] = await Promise.all([
          supabase.from('enrollments').select('id').eq('course_id', courseId).eq('user_id', user.id).maybeSingle(),
          supabase.from('lesson_completions').select('lesson_id').eq('course_id', courseId).eq('user_id', user.id),
        ]);
        setIsEnrolled(!!enrollment);
        if (completions) setCompletedLessons(new Set(completions.map(c => c.lesson_id)));
      }
      setLoading(false);
    };
    fetchData();
  }, [courseId, user]);

  const generateQuizForLesson = async (lesson: Lesson) => {
    if (!courseId || !course) return;
    setGeneratingQuiz(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-assessment-questions', {
        body: {
          lessonTitle: lesson.title,
          lessonContent: lesson.content,
          courseSubject: course.subject,
          gradeLevel: course.grade_level,
          questionCount: 5,
          difficulty: 'medium',
        },
      });

      if (error) throw error;
      if (!data?.questions?.length) throw new Error('No questions generated');

      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('course_assessments')
        .insert({
          course_id: courseId,
          title: `Quiz: ${lesson.title}`,
          assessment_type: 'lesson_quiz',
          lesson_id: lesson.id,
          question_count: data.questions.length,
          time_limit_minutes: 10,
          pass_threshold: 70,
          is_active: true,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Insert questions
      const questions = data.questions.map((q: any, idx: number) => ({
        assessment_id: assessment.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty_level: q.difficulty_level || 'medium',
        points: 1,
        order_index: idx,
      }));

      await supabase.from('assessment_questions').insert(questions);

      setAssessments(prev => [...prev, assessment as CourseAssessment]);
      toast.success(`Quiz generated with ${data.questions.length} questions!`);
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      toast.error(err?.message || 'Failed to generate quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const fetchRoster = async () => {
    if (!courseId) return;
    setLoadingRoster(true);
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('user_id, progress, enrolled_at')
      .eq('course_id', courseId);

    if (enrollments && enrollments.length > 0) {
      const userIds = enrollments.map(e => e.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      const profileMap: Record<string, string> = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p.full_name || 'Unknown'; });

      setStudents(enrollments.map(e => ({
        user_id: e.user_id,
        full_name: profileMap[e.user_id] || 'Unknown Student',
        progress: Number(e.progress) || 0,
        enrolled_at: e.enrolled_at,
      })));
    } else {
      setStudents([]);
    }
    setLoadingRoster(false);
    setShowRoster(true);
  };

  const handleEnroll = async () => {
    if (!user || !courseId) return;
    const { error } = await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId });
    if (error) {
      toast.error('Failed to enroll');
    } else {
      setIsEnrolled(true);
      toast.success('Enrolled successfully!');
    }
  };

  const markComplete = async (lessonId: string) => {
    if (!user || !courseId) return;
    const { error } = await supabase.from('lesson_completions').insert({
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
    });
    if (error && !error.message.includes('duplicate')) {
      toast.error('Failed to save progress');
      return;
    }
    setCompletedLessons(prev => new Set([...prev, lessonId]));
    const nextIndex = lessons.findIndex(l => l.id === lessonId) + 1;
    if (nextIndex < lessons.length) setActiveLesson(lessons[nextIndex]);

    const newProgress = ((completedLessons.size + 1) / lessons.length) * 100;
    await supabase.from('enrollments').update({ progress: Math.min(newProgress, 100) })
      .eq('user_id', user.id).eq('course_id', courseId);

    toast.success('Lesson completed!');
  };

  const saveNote = async () => {
    if (!user || !courseId || !activeLesson || !noteContent.trim()) return;
    setSavingNote(true);
    await (supabase as any).from('student_notes').insert({
      user_id: user.id,
      lesson_id: activeLesson.id,
      course_id: courseId,
      content: noteContent.trim(),
    });
    setNoteContent('');
    setSavingNote(false);
    toast.success('Note saved!');
  };

  const progress = lessons.length > 0 ? (completedLessons.size / lessons.length) * 100 : 0;

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  // Group materials
  const notesMaterials = materials.filter(m => m.type === 'notes');
  const pastPapers = materials.filter(m => m.type === 'past_paper');
  const papersByYear = pastPapers.reduce((acc, p) => {
    const year = p.year || 'Other';
    if (!acc[year]) acc[year] = [];
    acc[year].push(p);
    return acc;
  }, {} as Record<string, CourseMaterial[]>);
  const sortedYears = Object.keys(papersByYear).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="w-full py-12 px-4">
        <LogoLoader text="Loading course..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="w-full py-12 px-4 text-center">
        <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold mb-2">Course not found</h2>
        <Button onClick={() => navigate('/course-catalog')}>Back to Catalog</Button>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/course-catalog')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {course.subject && <Badge variant="secondary">{course.subject}</Badge>}
            {course.grade_level && <Badge variant="outline">{course.grade_level}</Badge>}
            <Badge variant="outline"><Layers className="w-3 h-3 mr-1" />{lessons.length} lessons</Badge>
            {materials.length > 0 && (
              <Badge variant="outline"><FileDown className="w-3 h-3 mr-1" />{materials.length} materials</Badge>
            )}
          </div>
          {course.description && <p className="text-sm text-muted-foreground mt-2">{course.description}</p>}
          <div className="flex gap-2 mt-2">
            {isEnrolled && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/course/${courseId}/assignments`)}>
                <ClipboardCheck className="w-4 h-4 mr-1" /> Assignments
              </Button>
            )}
            {isCreator && (
              <Button variant="outline" size="sm" onClick={fetchRoster} disabled={loadingRoster}>
                <Users className="w-4 h-4 mr-1" /> {loadingRoster ? 'Loading...' : 'Student Roster'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Student Roster (Creator only) */}
      {showRoster && isCreator && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Users className="w-4 h-4" />Enrolled Students ({students.length})</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowRoster(false)}>Close</Button>
            </div>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No students enrolled yet.</p>
            ) : (
              <div className="space-y-2">
                {students.map(s => (
                  <div key={s.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">Enrolled {new Date(s.enrolled_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{Math.round(s.progress)}%</p>
                        <Progress value={s.progress} className="h-1.5 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enrollment banner */}
      {!isEnrolled && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">Enroll to access all lessons</p>
              <p className="text-sm text-muted-foreground">Get full access to course content and track your progress.</p>
            </div>
            <Button onClick={handleEnroll}>Enroll Now</Button>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {isEnrolled && lessons.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Main content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Lesson Content */}
        <div className="md:col-span-2 space-y-4">
          {activeLesson ? (
            <motion.div key={activeLesson.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardContent className="p-0">
                  {activeLesson.video_url && (() => {
                    const embedUrl = getYouTubeEmbedUrl(activeLesson.video_url);
                    return embedUrl ? (
                      <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={activeLesson.title}
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                        <a href={activeLesson.video_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                          Open video in new tab
                        </a>
                      </div>
                    );
                  })()}

                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-foreground">{activeLesson.title}</h2>
                      {activeLesson.duration_minutes && (
                        <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{activeLesson.duration_minutes} min</Badge>
                      )}
                    </div>

                    {activeLesson.content ? (
                      <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap">
                        {activeLesson.content}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No written content for this lesson.</p>
                    )}

                    {isEnrolled && (
                      <div className="flex justify-end pt-2">
                        {completedLessons.has(activeLesson.id) ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            <CheckCircle className="w-4 h-4 mr-1" /> Completed
                          </Badge>
                        ) : (
                          <Button onClick={() => markComplete(activeLesson.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" /> Mark as Complete
                          </Button>
                        )}
                      </div>
                    )}

                    {isEnrolled && (
                      <div className="border-t border-border/50 pt-4 mt-4">
                        <Button variant="ghost" size="sm" onClick={() => setShowNotes(!showNotes)} className="mb-2 text-muted-foreground">
                          <StickyNote className="w-4 h-4 mr-2" /> {showNotes ? 'Hide Notes' : 'Take Notes'}
                        </Button>
                        {showNotes && (
                          <div className="space-y-2">
                            <Textarea
                              value={noteContent}
                              onChange={e => setNoteContent(e.target.value)}
                              placeholder="Write your notes for this lesson..."
                              className="min-h-[80px] bg-secondary/30"
                            />
                            <Button size="sm" onClick={saveNote} disabled={!noteContent.trim() || savingNote}>
                              <Save className="w-3.5 h-3.5 mr-1" /> Save Note
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No lessons available for this course yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar with Tabs */}
        <div>
          <Card>
            <CardContent className="p-0">
              <Tabs value={sidebarTab} onValueChange={setSidebarTab}>
                <div className="p-2 border-b border-border">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="lessons" className="text-xs gap-1">
                      <Play className="w-3 h-3" /> Lessons
                    </TabsTrigger>
                    <TabsTrigger value="assessments" className="text-xs gap-1">
                      <Brain className="w-3 h-3" /> Quizzes
                    </TabsTrigger>
                    <TabsTrigger value="materials" className="text-xs gap-1">
                      <FileDown className="w-3 h-3" /> Materials
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Lessons Tab */}
                <TabsContent value="lessons" className="m-0">
                  <div className="divide-y divide-border">
                    {lessons.map((lesson, i) => {
                      const isActive = activeLesson?.id === lesson.id;
                      const isComplete = completedLessons.has(lesson.id);
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => isEnrolled && setActiveLesson(lesson)}
                          disabled={!isEnrolled}
                          className={`w-full p-3 flex items-center gap-3 text-left transition-colors text-sm ${
                            isActive ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'
                          } ${!isEnrolled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                            isComplete ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {isComplete ? <CheckCircle className="w-4 h-4" /> : i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-foreground">{lesson.title}</p>
                            {lesson.duration_minutes && (
                              <p className="text-xs text-muted-foreground">{lesson.duration_minutes} min</p>
                            )}
                          </div>
                          {!isEnrolled ? (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          ) : lesson.video_url ? (
                            <Play className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      );
                    })}
                    {lessons.length === 0 && (
                      <div className="p-6 text-center text-sm text-muted-foreground">No lessons yet</div>
                    )}
                  </div>
                </TabsContent>

                {/* Assessments Tab */}
                <TabsContent value="assessments" className="m-0">
                  <div className="divide-y divide-border">
                    {/* Generate Quiz Button for Creators */}
                    {isCreator && activeLesson && (
                      <div className="p-3 bg-muted/30">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full gap-2"
                          onClick={() => generateQuizForLesson(activeLesson)}
                          disabled={generatingQuiz}
                        >
                          {generatingQuiz ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                          ) : (
                            <><Sparkles className="w-3.5 h-3.5" /> Generate AI Quiz</>
                          )}
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                          For: {activeLesson.title}
                        </p>
                      </div>
                    )}

                    {/* Assessment List */}
                    {assessments.length > 0 ? (
                      assessments.map(a => (
                        <button
                          key={a.id}
                          onClick={() => isEnrolled && navigate(`/assessment/${a.id}`)}
                          disabled={!isEnrolled}
                          className={`w-full p-3 flex items-center gap-3 text-left transition-colors text-sm hover:bg-muted/50 ${
                            !isEnrolled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Brain className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-foreground text-xs">{a.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{a.question_count} Qs</span>
                              {a.time_limit_minutes && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" /> {a.time_limit_minutes}m
                                </span>
                              )}
                              <span>Pass: {a.pass_threshold}%</span>
                            </div>
                          </div>
                          {!isEnrolled ? (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No quizzes available yet
                        {isCreator && <p className="text-xs mt-1">Generate a quiz above!</p>}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Materials Tab */}
                <TabsContent value="materials" className="m-0">
                  {materials.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No study materials available yet
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {/* Study Notes Section */}
                      {notesMaterials.length > 0 && (
                        <div>
                          <div className="px-3 py-2 bg-muted/30">
                            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                              <BookMarked className="w-3.5 h-3.5 text-primary" /> Study Notes ({notesMaterials.length})
                            </h4>
                          </div>
                          {notesMaterials.map(m => (
                            <a
                              key={m.id}
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 p-3 hover:bg-muted/50 transition-colors text-sm group"
                            >
                              <div className="w-7 h-7 rounded bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <BookMarked className="w-3.5 h-3.5 text-blue-500" />
                              </div>
                              <span className="flex-1 text-foreground group-hover:text-primary transition-colors truncate text-xs">
                                {m.title}
                              </span>
                              <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Past Papers Section grouped by year */}
                      {sortedYears.length > 0 && (
                        <div>
                          <div className="px-3 py-2 bg-muted/30">
                            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                              <FileText className="w-3.5 h-3.5 text-orange-500" /> Past Papers ({pastPapers.length})
                            </h4>
                          </div>
                          {sortedYears.map(year => (
                            <div key={year}>
                              <div className="px-3 py-1.5 bg-muted/10">
                                <span className="text-[11px] font-semibold text-muted-foreground">{year}</span>
                              </div>
                              {papersByYear[year].map(m => (
                                <a
                                  key={m.id}
                                  href={m.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-sm group"
                                >
                                  <div className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                    <FileDown className="w-3 h-3 text-orange-500" />
                                  </div>
                                  <span className="flex-1 text-foreground group-hover:text-primary transition-colors truncate text-xs">
                                    {m.title}
                                  </span>
                                  <Download className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
