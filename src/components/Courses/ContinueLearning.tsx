import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Clock } from 'lucide-react';
import { useContinueWatching } from '@/hooks/useCourseProgress';
import type { CourseTrack } from '@/data/freeCourses';

interface Props {
  track?: CourseTrack;
  limit?: number;
  title?: string;
}

const ContinueLearning: React.FC<Props> = ({ track, limit = 6, title = 'Continue learning' }) => {
  const all = useContinueWatching(limit * 2);
  const items = (track ? all.filter(i => i.course.track === track) : all).slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section className="space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> {title}
        </h2>
        <Link to="/free-courses" className="text-xs text-primary hover:underline">View all</Link>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ course, progress, percent }) => {
          const lastLessonId = progress.lastLessonId || course.lessons[0]?.videoId;
          const nextLesson = course.lessons.find(l => !progress.lessons[l.videoId]?.completed) || course.lessons.find(l => l.videoId === lastLessonId) || course.lessons[0];
          return (
            <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow border-border/40">
              <Link to={`/watch/${nextLesson.videoId}?title=${encodeURIComponent(nextLesson.title)}&course=${course.id}`} className="flex gap-3">
                <div className="relative w-32 aspect-video bg-muted flex-shrink-0">
                  <img src={course.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
                <CardContent className="p-2 flex-1 min-w-0">
                  <Badge variant="secondary" className="text-[10px] mb-1">{course.provider}</Badge>
                  <p className="text-sm font-medium line-clamp-1">{course.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">Next: {nextLesson.title}</p>
                  <Progress value={percent} className="h-1.5" />
                  <p className="text-[11px] text-muted-foreground mt-1">{percent}% complete</p>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueLearning;
