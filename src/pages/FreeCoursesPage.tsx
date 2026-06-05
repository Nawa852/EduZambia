import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/page-header';
import ContinueLearning from '@/components/Courses/ContinueLearning';
import { formatDistanceToNow } from 'date-fns';
import {
  GraduationCap, Clock, Play, ExternalLink, ArrowLeft, BookOpen, Search, Award, CheckCircle2, Circle, RotateCcw,
} from 'lucide-react';
import { FREE_COURSES, TRACK_META, type CourseTrack, type FreeCourse } from '@/data/freeCourses';
import { useCourseProgress, computePercent, getCourseProgress } from '@/hooks/useCourseProgress';

const TRACKS: (CourseTrack | 'all')[] = ['all', 'developer', 'entrepreneur', 'healthcare', 'skills'];

const CourseCard: React.FC<{ course: FreeCourse }> = ({ course }) => {
  const progress = getCourseProgress(course.id);
  const percent = computePercent(course, progress);
  const started = progress.updatedAt > 0;
  return (
    <Link to={`/free-courses/${course.id}`} className="group">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/40 h-full flex flex-col">
        <div className="relative aspect-video bg-muted overflow-hidden">
          <img
            src={course.thumbnail}
            alt={course.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <Badge className="absolute top-2 left-2 bg-background/90 text-foreground border-0">
            {TRACK_META[course.track].emoji} {course.provider}
          </Badge>
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-white bg-black/60 px-2 py-1 rounded">
            <Clock className="w-3 h-3" /> {course.hours}h
          </div>
          {started && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
              <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
          )}
        </div>
        <CardContent className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-foreground line-clamp-2 leading-snug">{course.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <Badge variant="secondary" className="text-xs">{course.level}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {started ? <><CheckCircle2 className="w-3 h-3 text-primary" /> {percent}%</> : <><BookOpen className="w-3 h-3" /> {course.lessons.length} lessons</>}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const FreeCoursesListing: React.FC = () => {
  const [params] = useSearchParams();
  const initial = (params.get('track') as CourseTrack | null) || 'all';
  const [track, setTrack] = useState<CourseTrack | 'all'>(initial);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => FREE_COURSES.filter(c => {
    if (track !== 'all' && c.track !== track) return false;
    if (q && !`${c.title} ${c.provider} ${c.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [track, q]);

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={GraduationCap}
          title="Free World-Class Courses"
          subtitle="Curated from Harvard, MIT, Stanford, Yale, YC, freeCodeCamp & WHO — take them right here on Edu Zambia."
          actions={
            <Badge variant="secondary" className="text-xs">
              <Award className="w-3 h-3 mr-1" /> {FREE_COURSES.length} courses · 100% free
            </Badge>
          }
        />

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search courses, providers or topics…"
              className="pl-9"
            />
          </div>
          <Tabs value={track} onValueChange={(v) => setTrack(v as any)}>
            <TabsList className="flex-wrap h-auto">
              {TRACKS.map(t => (
                <TabsTrigger key={t} value={t} className="text-xs lg:text-sm">
                  {t === 'all' ? 'All' : `${TRACK_META[t as CourseTrack].emoji} ${TRACK_META[t as CourseTrack].label.split(' ')[0]}`}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {track !== 'all' && (
          <p className="text-sm text-muted-foreground mb-4">{TRACK_META[track as CourseTrack].tagline}</p>
        )}

        <ContinueLearning track={track === 'all' ? undefined : (track as CourseTrack)} />

        {filtered.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No courses match your search.</CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const FreeCourseDetail: React.FC<{ course: FreeCourse }> = ({ course }) => {
  const navigate = useNavigate();
  const meta = TRACK_META[course.track];
  const { progress, markComplete } = useCourseProgress(course.id);
  const percent = computePercent(course, progress);
  const completedCount = course.lessons.filter(l => progress.lessons[l.videoId]?.completed).length;
  const nextLesson =
    course.lessons.find(l => !progress.lessons[l.videoId]?.completed) ||
    course.lessons.find(l => l.videoId === progress.lastLessonId) ||
    course.lessons[0];
  const started = progress.updatedAt > 0;

  const reset = () => {
    if (confirm('Reset progress for this course?')) {
      localStorage.removeItem(`courseProgress:${course.id}`);
      window.dispatchEvent(new CustomEvent('course-progress-changed', { detail: { courseId: course.id } }));
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/free-courses')} className="mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> All free courses
        </Button>

        <Card className="overflow-hidden mb-5 border-border/40">
          <div className="relative aspect-video sm:aspect-[21/9] bg-muted">
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
              <Badge className="bg-white/90 text-foreground border-0 mb-2">{meta.emoji} {course.provider}</Badge>
              <h1 className="text-xl sm:text-3xl font-bold mb-1">{course.title}</h1>
              {course.instructor && <p className="text-sm opacity-90">with {course.instructor}</p>}
            </div>
          </div>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-foreground/90">{course.description}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> ~{course.hours} hours</Badge>
              <Badge variant="secondary">{course.level}</Badge>
              <Badge variant="secondary"><BookOpen className="w-3 h-3 mr-1" /> {course.lessons.length} lessons</Badge>
              {course.tags.map(t => <Badge key={t} variant="outline">#{t}</Badge>)}
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-muted/40 border border-border/40">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Your progress</span>
                <span className="text-muted-foreground">{completedCount} / {course.lessons.length} lessons · {percent}%</span>
              </div>
              <Progress value={percent} className="h-2" />
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={() => navigate(`/watch/${nextLesson.videoId}?title=${encodeURIComponent(nextLesson.title)}&course=${course.id}`)}>
                  <Play className="w-4 h-4 mr-1" /> {started ? (percent === 100 ? 'Review' : 'Continue') : 'Start course'}
                </Button>
                {started && (
                  <Button size="sm" variant="ghost" onClick={reset}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Reset
                  </Button>
                )}
                {course.externalUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={course.externalUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" /> Official site
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold mb-3 text-foreground">Lessons</h2>
        <div className="space-y-2">
          {course.lessons.map((l, idx) => {
            const lp = progress.lessons[l.videoId];
            const isDone = !!lp?.completed;
            const isLast = progress.lastLessonId === l.videoId;
            return (
              <Card key={l.videoId + idx} className={`border-border/40 transition-colors ${isLast ? 'border-primary/50 ring-1 ring-primary/20' : 'hover:border-primary/40'}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <button
                    onClick={() => markComplete(l.videoId, !isDone)}
                    className="shrink-0"
                    aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isDone
                      ? <CheckCircle2 className="w-7 h-7 text-primary" />
                      : <Circle className="w-7 h-7 text-muted-foreground/50 hover:text-primary" />}
                  </button>
                  <img
                    src={`https://i.ytimg.com/vi/${l.videoId}/default.jpg`}
                    alt=""
                    className="w-20 h-12 object-cover rounded hidden sm:block"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      <span className="text-xs text-muted-foreground mr-1">{idx + 1}.</span>{l.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lp?.lastWatched ? `Watched ${formatDistanceToNow(lp.lastWatched, { addSuffix: true })}` : l.duration || 'Not started'}
                    </p>
                  </div>
                  <Button size="sm" variant={isLast && !isDone ? 'default' : 'outline'} onClick={() => navigate(`/watch/${l.videoId}?title=${encodeURIComponent(l.title)}&course=${course.id}`)}>
                    <Play className="w-4 h-4 mr-1" /> {isDone ? 'Replay' : isLast ? 'Resume' : 'Watch'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const FreeCoursesPage: React.FC = () => {
  const { courseId } = useParams<{ courseId?: string }>();
  if (courseId) {
    const course = FREE_COURSES.find(c => c.id === courseId);
    if (course) return <FreeCourseDetail course={course} />;
  }
  return <FreeCoursesListing />;
};

export default FreeCoursesPage;
