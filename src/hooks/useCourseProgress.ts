import { useCallback, useEffect, useState } from 'react';
import { FREE_COURSES, type FreeCourse } from '@/data/freeCourses';

// Lightweight localStorage-based progress tracker for free courses.
// One key per course: courseProgress:<courseId> = { lessons: { [videoId]: { completed, lastWatched, position } }, lastLessonId, updatedAt }

export interface LessonProgress {
  completed: boolean;
  lastWatched: number; // epoch ms
  position?: number;   // seconds (best-effort)
}

export interface CourseProgress {
  lessons: Record<string, LessonProgress>;
  lastLessonId?: string;
  updatedAt: number;
}

const KEY = (courseId: string) => `courseProgress:${courseId}`;
const EVENT = 'course-progress-changed';

const readRaw = (courseId: string): CourseProgress => {
  try {
    const raw = localStorage.getItem(KEY(courseId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lessons: {}, updatedAt: 0 };
};

const writeRaw = (courseId: string, value: CourseProgress) => {
  try {
    localStorage.setItem(KEY(courseId), JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { courseId } }));
  } catch {}
};

export function computePercent(course: FreeCourse, progress: CourseProgress) {
  const total = course.lessons.length || 1;
  const done = course.lessons.filter(l => progress.lessons[l.videoId]?.completed).length;
  return Math.round((done / total) * 100);
}

export function useCourseProgress(courseId?: string) {
  const [progress, setProgress] = useState<CourseProgress>(() => (courseId ? readRaw(courseId) : { lessons: {}, updatedAt: 0 }));

  useEffect(() => {
    if (!courseId) return;
    setProgress(readRaw(courseId));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.courseId === courseId) setProgress(readRaw(courseId));
    };
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, [courseId]);

  const markStarted = useCallback((videoId: string) => {
    if (!courseId) return;
    const cur = readRaw(courseId);
    const lesson = cur.lessons[videoId] || { completed: false, lastWatched: 0 };
    cur.lessons[videoId] = { ...lesson, lastWatched: Date.now() };
    cur.lastLessonId = videoId;
    cur.updatedAt = Date.now();
    writeRaw(courseId, cur);
  }, [courseId]);

  const markComplete = useCallback((videoId: string, completed = true) => {
    if (!courseId) return;
    const cur = readRaw(courseId);
    const lesson = cur.lessons[videoId] || { completed: false, lastWatched: Date.now() };
    cur.lessons[videoId] = { ...lesson, completed, lastWatched: Date.now() };
    cur.lastLessonId = videoId;
    cur.updatedAt = Date.now();
    writeRaw(courseId, cur);
  }, [courseId]);

  return { progress, markStarted, markComplete };
}

// Helper to read progress for a specific course outside the hook
export function getCourseProgress(courseId: string) {
  return readRaw(courseId);
}

// Returns courses sorted by most recent activity (only those started)
export function useContinueWatching(limit = 6) {
  const [items, setItems] = useState<{ course: FreeCourse; progress: CourseProgress; percent: number }[]>([]);

  useEffect(() => {
    const compute = () => {
      const list = FREE_COURSES
        .map(c => ({ course: c, progress: readRaw(c.id) }))
        .filter(x => x.progress.updatedAt > 0)
        .sort((a, b) => b.progress.updatedAt - a.progress.updatedAt)
        .slice(0, limit)
        .map(x => ({ ...x, percent: computePercent(x.course, x.progress) }));
      setItems(list);
    };
    compute();
    const handler = () => compute();
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, [limit]);

  return items;
}

// Lookup: given any videoId, return the parent free course (if any)
export function findCourseByVideoId(videoId: string): FreeCourse | undefined {
  return FREE_COURSES.find(c => c.lessons.some(l => l.videoId === videoId));
}
