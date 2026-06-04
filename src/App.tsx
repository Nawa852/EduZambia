import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsent } from '@/components/CookieConsent';
import { InstallPrompt } from '@/components/PWA/InstallPrompt';
import { OfflineBanner } from '@/components/PWA/OfflineBanner';
import { AuthProvider } from '@/components/Auth/AuthProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import PostLoginGate from '@/components/Auth/PostLoginGate';
import { MainLayout } from '@/components/Layout/MainLayout';
import { LogoLoader } from '@/components/UI/LogoLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import DemoBanner from '@/components/Auth/DemoBanner';
import RoleGuard from '@/components/Auth/RoleGuard';

// Stakeholders allowed to access ECZ content (K-12 only)
const ECZ_ROLES = ['student', 'teacher', 'guardian', 'institution', 'ministry'] as const;

// Core Pages (eagerly loaded)
import Index from '@/pages/Index';
import AuthPage from '@/pages/AuthPage';
import NotFound from '@/pages/NotFound';

// Lazy: public
const ChooseRolePage = React.lazy(() => import('@/pages/ChooseRolePage'));
const PasswordResetPage = React.lazy(() => import('@/pages/PasswordResetPage'));
const About = React.lazy(() => import('@/pages/About'));
const Contact = React.lazy(() => import('@/pages/Contact'));
const SetupPage = React.lazy(() => import('@/pages/SetupPage'));

// Lazy: Hub pages
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const LearnHub = React.lazy(() => import('@/pages/hubs/LearnHub'));
const AIHub = React.lazy(() => import('@/pages/hubs/AIHub'));
const PrepareHub = React.lazy(() => import('@/pages/hubs/PrepareHub'));
const ConnectHub = React.lazy(() => import('@/pages/hubs/ConnectHub'));
const ProgressHub = React.lazy(() => import('@/pages/hubs/ProgressHub'));
const ProfileHub = React.lazy(() => import('@/pages/hubs/ProfileHub'));
const ECZHub = React.lazy(() => import('@/pages/hubs/ECZHub'));
const TeachHub = React.lazy(() => import('@/pages/hubs/TeachHub'));
const FamilyHub = React.lazy(() => import('@/pages/hubs/FamilyHub'));
const MinistryHub = React.lazy(() => import('@/pages/hubs/MinistryHub'));
const AdminHub = React.lazy(() => import('@/pages/hubs/AdminHub'));
const CybersecurityHub = React.lazy(() => import('@/pages/hubs/CybersecurityHub'));
const CyberTerminalSandboxPage = React.lazy(() => import('@/pages/CyberTerminalSandboxPage'));
const CyberSOCSimulatorPage = React.lazy(() => import('@/pages/CyberSOCSimulatorPage'));
const CyberSkillTreePage = React.lazy(() => import('@/pages/CyberSkillTreePage'));
const SetupSchedulePage = React.lazy(() => import('@/pages/SetupSchedulePage'));
const EntrepreneurHub = React.lazy(() => import('@/pages/hubs/EntrepreneurHub'));
const NGOHub = React.lazy(() => import('@/pages/hubs/NGOHub'));
const VideoRoomsPage = React.lazy(() => import('@/pages/VideoRoomsPage'));
const StudyGroupsHubPage = React.lazy(() => import('@/pages/StudyGroupsHubPage'));
const VideoWatchPage = React.lazy(() => import('@/pages/VideoWatchPage'));
const GroupChatPage = React.lazy(() => import('@/pages/GroupChatPage'));
const GroupFilesPage = React.lazy(() => import('@/pages/GroupFilesPage'));
const GroupVideoPage = React.lazy(() => import('@/pages/GroupVideoPage'));
const SchoolAnnouncementsPage = React.lazy(() => import('@/pages/SchoolAnnouncementsPage'));
const DonorImpactPage = React.lazy(() => import('@/pages/DonorImpactPage'));
const ToolsHub = React.lazy(() => import('@/pages/hubs/ToolsHub'));
const FreeCoursesPage = React.lazy(() => import('@/pages/FreeCoursesPage'));

// Lazy: Dynamic detail pages (keep standalone)
const CourseDetailPage = React.lazy(() => import('@/pages/CourseDetailPage'));
const AssignmentPage = React.lazy(() => import('@/pages/AssignmentPage'));
const AssessmentTakingPage = React.lazy(() => import('@/pages/AssessmentTakingPage'));
const AssessmentResultsPage = React.lazy(() => import('@/pages/AssessmentResultsPage'));
const CreateCoursePage = React.lazy(() => import('@/pages/CreateCoursePage'));
const StudyGroupChatPage = React.lazy(() => import('@/pages/StudyGroupChatPage'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const PG = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><PostLoginGate><MainLayout>{children}</MainLayout></PostLoginGate></ProtectedRoute>
);

const SuspenseWrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LogoLoader text="Loading..." /></div>}>
    {children}
  </Suspense>
);

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <DemoBanner />
          <SuspenseWrap>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />
              <Route path="/password-reset" element={<PasswordResetPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/choose-role" element={<ProtectedRoute><ChooseRolePage /></ProtectedRoute>} />
              <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />

              {/* ─── Hub Pages ─────────────────────────────────── */}
              <Route path="/dashboard" element={<PG><Dashboard /></PG>} />
              <Route path="/learn" element={<PG><LearnHub /></PG>} />
              <Route path="/ai" element={<PG><AIHub /></PG>} />
              <Route path="/prepare" element={<PG><PrepareHub /></PG>} />
              <Route path="/connect" element={<PG><ConnectHub /></PG>} />
              <Route path="/progress" element={<PG><ProgressHub /></PG>} />
              <Route path="/profile" element={<PG><ProfileHub /></PG>} />
              <Route path="/ecz" element={<PG><RoleGuard allow={[...ECZ_ROLES]}><ECZHub /></RoleGuard></PG>} />
              <Route path="/watch" element={<PG><VideoWatchPage /></PG>} />
              <Route path="/watch/:videoId" element={<PG><VideoWatchPage /></PG>} />
              <Route path="/teach" element={<PG><TeachHub /></PG>} />
              <Route path="/family" element={<PG><FamilyHub /></PG>} />
              <Route path="/ministry" element={<PG><MinistryHub /></PG>} />
              <Route path="/admin" element={<PG><AdminHub /></PG>} />
              <Route path="/cybersecurity" element={<PG><CybersecurityHub /></PG>} />
              <Route path="/cyber-terminal" element={<PG><CyberTerminalSandboxPage /></PG>} />
              <Route path="/cyber-soc" element={<PG><CyberSOCSimulatorPage /></PG>} />
              <Route path="/cyber-skills" element={<PG><CyberSkillTreePage /></PG>} />
              <Route path="/setup-schedule" element={<PG><SetupSchedulePage /></PG>} />
              <Route path="/entrepreneur" element={<PG><EntrepreneurHub /></PG>} />
              <Route path="/ngo" element={<PG><NGOHub /></PG>} />
              <Route path="/video-rooms" element={<PG><VideoRoomsPage /></PG>} />
              <Route path="/groups" element={<PG><StudyGroupsHubPage /></PG>} />
              <Route path="/group/:groupId/chat" element={<PG><GroupChatPage /></PG>} />
              <Route path="/group/:groupId/files" element={<PG><GroupFilesPage /></PG>} />
              <Route path="/group/:groupId/video" element={<PG><GroupVideoPage /></PG>} />
              <Route path="/school-announcements" element={<PG><SchoolAnnouncementsPage /></PG>} />
              <Route path="/donor-impact" element={<DonorImpactPage />} />
              <Route path="/tools" element={<PG><ToolsHub /></PG>} />
              <Route path="/free-courses" element={<PG><FreeCoursesPage /></PG>} />
              <Route path="/free-courses/:courseId" element={<PG><FreeCoursesPage /></PG>} />

              {/* Tools & Resources — redirect overlapping tool routes to unified hub */}
              <Route path="/all-tools" element={<Navigate to="/tools" replace />} />
              <Route path="/resources" element={<Navigate to="/tools" replace />} />
              <Route path="/tools-hub" element={<Navigate to="/tools" replace />} />
              <Route path="/study-tools" element={<Navigate to="/tools" replace />} />
              <Route path="/ai-tools" element={<Navigate to="/tools" replace />} />

              {/* ─── Dynamic Detail Pages ──────────────────────── */}
              <Route path="/course/:courseId" element={<PG><CourseDetailPage /></PG>} />
              <Route path="/course/:courseId/assignments" element={<PG><AssignmentPage /></PG>} />
              <Route path="/assessment/:assessmentId" element={<PG><AssessmentTakingPage /></PG>} />
              <Route path="/assessment-results/:attemptId" element={<PG><AssessmentResultsPage /></PG>} />
              <Route path="/create-course" element={<PG><CreateCoursePage /></PG>} />
              <Route path="/study-chat" element={<PG><StudyGroupChatPage /></PG>} />

              {/* ─── Backwards Compatibility Redirects ─────────── */}
              {/* Learning */}
              <Route path="/my-courses" element={<Navigate to="/learn?tab=my-courses" replace />} />
              <Route path="/course-catalog" element={<Navigate to="/learn?tab=catalog" replace />} />
              <Route path="/courses" element={<Navigate to="/learn?tab=my-courses" replace />} />
              <Route path="/lessons" element={<Navigate to="/learn?tab=lessons" replace />} />
              <Route path="/video-learning" element={<Navigate to="/learn?tab=videos" replace />} />
              <Route path="/youtube-learning" element={<Navigate to="/learn?tab=youtube" replace />} />
              <Route path="/live-learning" element={<Navigate to="/learn?tab=live" replace />} />

              {/* AI */}
              <Route path="/flashcards" element={<Navigate to="/ai?tab=flashcards" replace />} />
              <Route path="/ai-tutor" element={<Navigate to="/ai?tab=tutor" replace />} />
              <Route path="/multi-ai-tutor" element={<Navigate to="/ai?tab=tutor" replace />} />
              <Route path="/ai-quiz" element={<Navigate to="/ai?tab=quiz" replace />} />
              <Route path="/mind-maps" element={<Navigate to="/ai?tab=mind-maps" replace />} />
              <Route path="/teach-back" element={<Navigate to="/ai?tab=teach-back" replace />} />
              <Route path="/comprehensive-ai" element={<Navigate to="/ai?tab=workspace" replace />} />
              <Route path="/study-assistant" element={<Navigate to="/ai?tab=chat" replace />} />
              <Route path="/learning-path" element={<Navigate to="/ai?tab=chat" replace />} />
              <Route path="/adaptive-difficulty" element={<Navigate to="/ai?tab=chat" replace />} />

              {/* Prepare */}
              <Route path="/study-planner" element={<Navigate to="/prepare?tab=planner" replace />} />
              <Route path="/focus-mode" element={<Navigate to="/prepare?tab=focus" replace />} />
              <Route path="/my-notes" element={<Navigate to="/prepare?tab=notes" replace />} />
              <Route path="/goals" element={<Navigate to="/prepare?tab=goals" replace />} />
              <Route path="/pomodoro" element={<Navigate to="/prepare?tab=pomodoro" replace />} />
              <Route path="/journaling" element={<Navigate to="/prepare?tab=journal" replace />} />
              <Route path="/journal" element={<Navigate to="/prepare?tab=journal" replace />} />
              <Route path="/bookmarks" element={<Navigate to="/prepare?tab=bookmarks" replace />} />

              {/* Connect */}
              <Route path="/messenger" element={<Navigate to="/connect?tab=messenger" replace />} />
              <Route path="/study-groups" element={<Navigate to="/connect?tab=groups" replace />} />
              <Route path="/community" element={<Navigate to="/connect?tab=community" replace />} />
              <Route path="/mentorship-hub" element={<Navigate to="/connect?tab=mentorship" replace />} />
              <Route path="/mentorship" element={<Navigate to="/connect?tab=mentorship" replace />} />
              <Route path="/social-feed" element={<Navigate to="/connect?tab=community" replace />} />
              <Route path="/communication-hub" element={<Navigate to="/connect?tab=messenger" replace />} />

              {/* Progress */}
              <Route path="/analytics" element={<Navigate to="/progress?tab=analytics" replace />} />
              <Route path="/achievements" element={<Navigate to="/progress?tab=achievements" replace />} />
              <Route path="/leaderboard" element={<Navigate to="/progress?tab=leaderboard" replace />} />
              <Route path="/certificates" element={<Navigate to="/progress?tab=certificates" replace />} />

              {/* Profile */}
              <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />
              <Route path="/notifications" element={<Navigate to="/profile?tab=notifications" replace />} />
              <Route path="/personalization" element={<Navigate to="/profile?tab=settings" replace />} />

              {/* ECZ */}
              <Route path="/ecz-past-papers" element={<Navigate to="/ecz?tab=papers" replace />} />
              <Route path="/ecz-exam-simulator" element={<Navigate to="/ecz?tab=simulator" replace />} />
              <Route path="/ecz-videos" element={<Navigate to="/ecz?tab=videos" replace />} />
              <Route path="/ecz-practice-quiz" element={<Navigate to="/ecz?tab=quiz" replace />} />
              <Route path="/ecz-resource-library" element={<Navigate to="/ecz?tab=resources" replace />} />
              <Route path="/zambian-resources" element={<Navigate to="/ecz?tab=resources" replace />} />

              {/* Video — unified watch page */}
              <Route path="/video-learning" element={<Navigate to="/watch" replace />} />
              <Route path="/youtube-learning" element={<Navigate to="/watch" replace />} />
              <Route path="/student-videos" element={<Navigate to="/watch" replace />} />
              <Route path="/role-videos" element={<Navigate to="/watch" replace />} />

              {/* Teacher */}
              <Route path="/teacher-gradebook" element={<Navigate to="/teach?tab=gradebook" replace />} />
              <Route path="/teacher-lesson-plan" element={<Navigate to="/teach?tab=lesson-plans" replace />} />
              <Route path="/teacher-analytics" element={<Navigate to="/teach?tab=analytics" replace />} />
              <Route path="/teacher-announcements" element={<Navigate to="/teach?tab=announcements" replace />} />
              <Route path="/teacher-attendance-qr" element={<Navigate to="/teach?tab=attendance" replace />} />
              <Route path="/teacher-dashboard" element={<Navigate to="/dashboard" replace />} />

              {/* Guardian */}
              <Route path="/parent-children" element={<Navigate to="/family?tab=children" replace />} />
              <Route path="/parent-grades" element={<Navigate to="/family?tab=grades" replace />} />
              <Route path="/parental-controls" element={<Navigate to="/family?tab=controls" replace />} />
              <Route path="/guardian-homework" element={<Navigate to="/family?tab=homework" replace />} />
              <Route path="/guardian-rewards" element={<Navigate to="/family?tab=rewards" replace />} />
              <Route path="/guardian-activity-feed" element={<Navigate to="/family?tab=activity" replace />} />
              <Route path="/parent-dashboard" element={<Navigate to="/dashboard" replace />} />

              {/* Ministry */}
              <Route path="/ministry-dashboard" element={<Navigate to="/ministry?tab=overview" replace />} />
              <Route path="/ministry/schools" element={<Navigate to="/ministry?tab=schools" replace />} />
              <Route path="/ministry/ecz-analytics" element={<Navigate to="/ministry?tab=analytics" replace />} />
              <Route path="/ministry/policies" element={<Navigate to="/ministry?tab=policy" replace />} />
              <Route path="/ministry/budget" element={<Navigate to="/ministry?tab=budget" replace />} />
              <Route path="/ministry/reports" element={<Navigate to="/ministry?tab=reports" replace />} />
              <Route path="/ministry/live-stats" element={<Navigate to="/ministry?tab=live" replace />} />

              {/* Admin */}
              <Route path="/school-admin" element={<Navigate to="/admin?tab=overview" replace />} />
              <Route path="/admin/users" element={<Navigate to="/admin?tab=users" replace />} />
              <Route path="/admin/curriculum" element={<Navigate to="/admin?tab=curriculum" replace />} />
              <Route path="/admin/scheduling" element={<Navigate to="/admin?tab=scheduling" replace />} />
              <Route path="/admin/analytics" element={<Navigate to="/admin?tab=analytics" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SuspenseWrap>
          <Toaster />
          <CookieConsent />
          <InstallPrompt />
          <OfflineBanner />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
