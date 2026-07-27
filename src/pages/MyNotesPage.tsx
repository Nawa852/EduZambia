import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StickyNote, BookOpen, Trash2, Edit3, Save, X, Inbox, Printer, Mic, MicOff, Loader2, FileAudio, Filter, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Note {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  lesson_id: string | null;
  course_id: string | null;
  lesson_title?: string;
  course_title?: string;
}

interface CourseOption {
  id: string;
  title: string;
}

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Civic Education', 'Computer Science', 'Other'];

const MyNotesPage = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef('');

  // Tagging state for recording
  const [recSubject, setRecSubject] = useState('');
  const [recCourseId, setRecCourseId] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);

  // Enrolled courses for tagging
  const [enrolledCourses, setEnrolledCourses] = useState<CourseOption[]>([]);

  // Filter state
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadNotes();
    loadEnrolledCourses();
  }, [user]);

  const loadEnrolledCourses = async () => {
    if (!user) { setLoading(false); return; }
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id);

    if (!enrollments?.length) return;

    const courseIds = enrollments.map(e => e.course_id);
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);

    if (courses) setEnrolledCourses(courses);
  };

  const loadNotes = async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await (supabase as any)
      .from('student_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) { toast.error('Failed to load notes'); setLoading(false); return; }

    if (data) {
      const courseIds = [...new Set(data.filter((n: any) => n.course_id).map((n: any) => n.course_id))] as string[];
      const lessonIds = [...new Set(data.filter((n: any) => n.lesson_id).map((n: any) => n.lesson_id))] as string[];

      const [{ data: courses }, { data: lessons }] = await Promise.all([
        courseIds.length ? supabase.from('courses').select('id, title').in('id', courseIds) : { data: [] as any[] },
        lessonIds.length ? supabase.from('lessons').select('id, title').in('id', lessonIds) : { data: [] as any[] },
      ]);

      const courseMap = Object.fromEntries((courses || []).map((c: any) => [c.id, c.title]));
      const lessonMap = Object.fromEntries((lessons || []).map((l: any) => [l.id, l.title]));

      setNotes(data.map((n: any) => ({
        ...n,
        course_title: courseMap[n.course_id] || undefined,
        lesson_title: lessonMap[n.lesson_id] || undefined,
      })));
    }
    setLoading(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-ZM';

    transcriptRef.current = '';
    setLiveTranscript('');
    setRecordingTime(0);

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
        else interim += event.results[i][0].transcript;
      }
      transcriptRef.current = final;
      setLiveTranscript(final + interim);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') toast.error('Microphone error: ' + e.error);
    };

    recognition.onend = () => {
      if (isRecording) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const transcript = transcriptRef.current.trim();
    if (!transcript) {
      toast.error('No speech detected. Try again.');
      setLiveTranscript('');
      return;
    }

    setIsTranscribing(true);

    const now = new Date().toISOString();
    const subjectTag = recSubject && recSubject !== '' ? ` [${recSubject}]` : '';
    const title = `🎙️ Lecture Recording${subjectTag} — ${new Date().toLocaleDateString('en-ZM', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

    const insertData: any = {
      user_id: user!.id,
      title,
      content: transcript,
      created_at: now,
      updated_at: now,
    };

    if (recCourseId) insertData.course_id = recCourseId;

    const { data, error } = await (supabase as any)
      .from('student_notes')
      .insert(insertData)
      .select()
      .single();

    setIsTranscribing(false);
    setLiveTranscript('');

    if (error) {
      toast.error('Failed to save recording');
      return;
    }

    const courseName = enrolledCourses.find(c => c.id === recCourseId)?.title;
    setNotes(prev => [{ ...data, course_title: courseName || undefined, lesson_title: undefined }, ...prev]);
    toast.success('Lecture recording saved!');
    setRecSubject('');
    setRecCourseId('');
    setShowTagPicker(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const deleteNote = async (id: string) => {
    const { error } = await (supabase as any).from('student_notes').delete().eq('id', id);
    if (error) { toast.error('Failed to delete note'); return; }
    setNotes(prev => prev.filter(n => n.id !== id));
    toast.success('Note deleted');
  };

  const saveEdit = async (id: string) => {
    const { error } = await (supabase as any).from('student_notes').update({ 
      title: editTitle || null, content: editContent, updated_at: new Date().toISOString() 
    }).eq('id', id);
    if (error) { toast.error('Failed to save note'); return; }
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title: editTitle || null, content: editContent, updated_at: new Date().toISOString() } : n));
    setEditingId(null);
    toast.success('Note updated');
  };

  // Extract subject tags from titles for filtering
  const getSubjectFromTitle = (title: string | null) => {
    if (!title) return null;
    const match = title.match(/\[(.+?)\]/);
    return match ? match[1] : null;
  };

  const availableSubjectsInNotes = [...new Set(notes.map(n => getSubjectFromTitle(n.title)).filter(Boolean))] as string[];
  const availableCoursesInNotes = [...new Set(notes.filter(n => n.course_title).map(n => n.course_title!))] as string[];

  const filteredNotes = notes.filter(n => {
    if (filterSubject !== 'all') {
      const noteSubject = getSubjectFromTitle(n.title);
      if (noteSubject !== filterSubject) return false;
    }
    if (filterCourse !== 'all') {
      if (n.course_title !== filterCourse) return false;
    }
    return true;
  });

  if (loading) return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-primary" /> My Notes
          </h1>
          <p className="text-sm text-muted-foreground">{filteredNotes.length} of {notes.length} notes</p>
        </div>
        <div className="flex gap-2">
          {notes.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" />PDF
            </Button>
          )}
        </div>
      </div>

      {/* Lecture Recording Card */}
      <Card className={`border-2 transition-colors ${isRecording ? 'border-destructive/50 bg-destructive/5' : 'border-dashed border-primary/30 hover:border-primary/50'}`}>
        <CardContent className="py-4 space-y-3">
          {!isRecording && !isTranscribing && (
            <>
              {/* Tag Picker */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTagPicker(!showTagPicker)}
                  className="text-xs"
                >
                  <Tag className="w-3.5 h-3.5 mr-1" />
                  {recSubject || recCourseId ? 'Tagged' : 'Add Tags'}
                  {(recSubject || recCourseId) && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {[recSubject, enrolledCourses.find(c => c.id === recCourseId)?.title].filter(Boolean).join(' · ')}
                    </Badge>
                  )}
                </Button>
              </div>

              {showTagPicker && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border">
                  <div className="w-full sm:w-auto flex-1 min-w-[140px]">
                    <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Subject</label>
                    <Select value={recSubject} onValueChange={setRecSubject}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-auto flex-1 min-w-[140px]">
                    <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Course</label>
                    <Select value={recCourseId} onValueChange={setRecCourseId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {enrolledCourses.length === 0 ? (
                          <SelectItem value="_none" disabled className="text-xs">No enrolled courses</SelectItem>
                        ) : (
                          enrolledCourses.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.title}</SelectItem>)
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {(recSubject || recCourseId) && (
                    <Button variant="ghost" size="sm" className="self-end h-8 text-xs" onClick={() => { setRecSubject(''); setRecCourseId(''); }}>
                      <X className="w-3 h-3 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              )}

              <button onClick={startRecording} className="w-full flex items-center justify-center gap-3 py-2 group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mic className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Record Lecture</p>
                  <p className="text-xs text-muted-foreground">Tap to start — speech will be transcribed to a note</p>
                </div>
              </button>
            </>
          )}

          {isRecording && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                  </span>
                  <span className="text-sm font-medium text-destructive">Recording</span>
                  <Badge variant="outline" className="font-mono text-xs">{formatTime(recordingTime)}</Badge>
                  {recSubject && <Badge variant="secondary" className="text-[10px]">{recSubject}</Badge>}
                </div>
                <Button size="sm" variant="destructive" onClick={stopRecording}>
                  <MicOff className="w-4 h-4 mr-1" /> Stop & Save
                </Button>
              </div>
              {liveTranscript && (
                <div className="bg-background/80 rounded-lg p-3 max-h-32 overflow-y-auto border">
                  <p className="text-xs text-muted-foreground mb-1">Live transcript:</p>
                  <p className="text-sm text-foreground">{liveTranscript}</p>
                </div>
              )}
            </div>
          )}

          {isTranscribing && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Saving recording...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      {notes.length > 0 && (availableSubjectsInNotes.length > 0 || availableCoursesInNotes.length > 0) && (
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {availableSubjectsInNotes.length > 0 && (
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Subjects</SelectItem>
                {availableSubjectsInNotes.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {availableCoursesInNotes.length > 0 && (
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Courses</SelectItem>
                {availableCoursesInNotes.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {(filterSubject !== 'all' || filterCourse !== 'all') && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterSubject('all'); setFilterCourse('all'); }}>
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      )}

      {filteredNotes.length === 0 && notes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-foreground">No notes yet</p>
            <p className="text-sm text-muted-foreground mt-1">Take notes while studying or record a lecture above.</p>
          </CardContent>
        </Card>
      ) : filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Filter className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No notes match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map(note => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {note.title?.startsWith('🎙️') && (
                        <Badge variant="secondary" className="text-xs"><FileAudio className="w-3 h-3 mr-1" />Recording</Badge>
                      )}
                      {getSubjectFromTitle(note.title) && (
                        <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20 border-0">
                          <Tag className="w-3 h-3 mr-1" />{getSubjectFromTitle(note.title)}
                        </Badge>
                      )}
                      {note.course_title && <Badge variant="secondary" className="text-xs"><BookOpen className="w-3 h-3 mr-1" />{note.course_title}</Badge>}
                      {note.lesson_title && <Badge variant="outline" className="text-xs">{note.lesson_title}</Badge>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {editingId === note.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveEdit(note.id)}><Save className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(note.id); setEditTitle(note.title || ''); setEditContent(note.content); }}><Edit3 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteNote(note.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Input placeholder="Note title (optional)" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="font-medium" />
                      <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="min-h-[80px]" />
                    </div>
                  ) : (
                    <>
                      {note.title && <p className="text-sm font-semibold text-foreground mb-1">{note.title}</p>}
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{note.content}</p>
                    </>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-2">
                    {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyNotesPage;
