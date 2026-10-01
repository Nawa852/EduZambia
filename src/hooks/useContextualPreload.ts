import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_GRAPH: Record<string, string[]> = {
  '/dashboard': ['/my-courses', '/ai', '/focus-mode', '/study-planner', '/analytics', '/course-catalog'],
  '/my-courses': ['/dashboard', '/course-catalog', '/flashcards', '/ai-quiz'],
  '/course-catalog': ['/my-courses', '/dashboard'],
  '/ai': ['/dashboard', '/ai-quiz', '/flashcards', '/mind-maps'],
  '/focus-mode': ['/dashboard', '/pomodoro', '/study-planner'],
  '/study-planner': ['/dashboard', '/focus-mode', '/my-assignments'],
  '/flashcards': ['/spaced-repetition', '/ai-quiz', '/ai'],
  '/ai-quiz': ['/flashcards', '/ai', '/ecz-past-papers'],
  '/mind-maps': ['/ai', '/my-notes'],
  '/my-assignments': ['/dashboard', '/study-planner'],
  '/ecz-past-papers': ['/ecz-exam-simulator', '/ai-quiz'],
  '/ecz-exam-simulator': ['/ecz-past-papers', '/ai-quiz'],
  '/analytics': ['/dashboard', '/achievements', '/goals'],
  '/achievements': ['/analytics', '/dashboard'],
  '/goals': ['/analytics', '/study-planner'],
  '/my-notes': ['/dashboard', '/mind-maps'],
  '/pomodoro': ['/focus-mode', '/dashboard'],
  '/bookmarks': ['/dashboard', '/my-courses'],
  '/spaced-repetition': ['/flashcards', '/ai-quiz'],
  '/reading-list': ['/dashboard', '/bookmarks'],
  '/study-groups': ['/messenger', '/social-feed'],
  '/messenger': ['/study-groups', '/dashboard'],
  '/profile': ['/settings', '/dashboard'],
  '/settings': ['/profile', '/notification-preferences'],
  '/certificates': ['/achievements', '/my-courses'],
};

const navigationHistory: string[] = [];
const transitionCounts: Record<string, Record<string, number>> = {};

function recordTransition(from: string, to: string) {
  if (!transitionCounts[from]) transitionCounts[from] = {};
  transitionCounts[from][to] = (transitionCounts[from][to] || 0) + 1;
  navigationHistory.push(to);
  if (navigationHistory.length > 100) navigationHistory.shift();
}

function getLearnedPredictions(currentPath: string): string[] {
  const counts = transitionCounts[currentPath];
  if (!counts) return [];
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([path]) => path);
}

export function useContextualPreload() {
  const location = useLocation();

  const preloadRoute = useCallback((path: string) => {
    const routeMap: Record<string, () => Promise<any>> = {
      '/dashboard': () => import('@/pages/Dashboard'),
      '/my-courses': () => import('@/pages/MyCoursesPage'),
      '/course-catalog': () => import('@/pages/CourseCatalogPage'),
      '/focus-mode': () => import('@/pages/FocusModePage'),
      '/study-planner': () => import('@/pages/StudyPlannerPage'),
      '/flashcards': () => import('@/pages/AIFlashcardPage'),
      '/ai-quiz': () => import('@/pages/AIQuizGeneratorPage'),
      '/mind-maps': () => import('@/pages/VisualMindMapPage'),
      '/analytics': () => import('@/pages/Analytics'),
      '/achievements': () => import('@/pages/Achievements'),
      '/goals': () => import('@/pages/GoalsPage'),
      '/my-notes': () => import('@/pages/MyNotesPage'),
      '/pomodoro': () => import('@/pages/PomodoroPage'),
      '/bookmarks': () => import('@/pages/BookmarksPage'),
      '/spaced-repetition': () => import('@/pages/SpacedRepetitionPage'),
      '/reading-list': () => import('@/pages/ReadingListPage'),
      '/my-assignments': () => import('@/pages/MyAssignmentsPage'),
      '/ecz-past-papers': () => import('@/pages/ECZPastPapersPage'),
      '/ecz-exam-simulator': () => import('@/pages/ECZExamSimulatorPage'),
      '/study-groups': () => import('@/pages/StudyGroupsPage'),
      '/profile': () => import('@/pages/Profile'),
      '/settings': () => import('@/pages/SettingsPage'),
      '/certificates': () => import('@/pages/CertificatesPage'),
    };

    const loader = routeMap[path];
    if (loader) loader().catch(() => {});
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = navigationHistory[navigationHistory.length - 1];
    
    if (previousPath && previousPath !== currentPath) {
      recordTransition(previousPath, currentPath);
    }

    const timer = setTimeout(() => {
      const staticPredictions = ROUTE_GRAPH[currentPath] || [];
      const learnedPredictions = getLearnedPredictions(currentPath);
      const combined = [...new Set([...learnedPredictions, ...staticPredictions])].slice(0, 4);
      
      combined.forEach((path, i) => {
        setTimeout(() => preloadRoute(path), i * 500);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [location.pathname, preloadRoute]);

  return { preloadRoute };
}
