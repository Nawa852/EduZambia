import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { RoleBasedSidebar } from '@/components/Sidebar/RoleBasedSidebar';
import { TopNavbar } from '@/components/Layout/TopNavbar';
import { MobileBottomNav } from '@/components/Layout/MobileBottomNav';
import { TeacherQuickActionsBar } from '@/components/Layout/TeacherQuickActionsBar';

import { ScrollToTop } from '@/components/UI/ScrollToTop';
import { QuickNoteButton } from '@/components/UI/QuickNoteButton';
import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';
import { useStudySchedule } from '@/hooks/useStudySchedule';
import { ScheduleEnforcer } from '@/components/DeviceControl/ScheduleEnforcer';
import { OfflineBanner } from '@/components/PWA/OfflineBanner';
import { useContextualPreload } from '@/hooks/useContextualPreload';
import { useTimeCapsule } from '@/hooks/useTimeCapsule';
import { useDeepOffline } from '@/hooks/useDeepOffline';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Calendar, Play, X, ChevronRight, Home, Search } from 'lucide-react';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { getCommandNavigationByRole, matchesNavItem } from '@/components/Sidebar/sidebarConfig';

interface MainLayoutProps {
  children: React.ReactNode;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', learn: 'Learning Hub', ai: 'AI Workspace',
  prepare: 'Study Hub', ecz: 'ECZ Exams', progress: 'Progress',
  connect: 'Connect', profile: 'Profile', teach: 'Teaching Hub',
  family: 'Family', admin: 'Admin', ministry: 'Ministry',
  course: 'Course',
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  useSecurityAlerts();
  useContextualPreload();
  useTimeCapsule();
  useDeepOffline();
  const { getActiveNow } = useStudySchedule();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const role = (profile?.role as string) || 'student';
  const [activeSchedule, setActiveSchedule] = useState<ReturnType<typeof getActiveNow>>(undefined);
  const [dismissed, setDismissed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const check = () => setActiveSchedule(getActiveNow());
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [getActiveNow]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCmdOpen(o => !o); }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const breadcrumbs = location.pathname.split('/').filter(Boolean).map((segment, i, arr) => {
    const path = '/' + arr.slice(0, i + 1).join('/');
    const label = ROUTE_LABELS[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return { label, path, isLast: i === arr.length - 1 };
  });
  const commandItems = useMemo(() => getCommandNavigationByRole(role), [role]);
  const commandGroups = useMemo(() => Array.from(new Set(commandItems.map(item => item.group))), [commandItems]);
  const showBreadcrumbs = breadcrumbs.length > 1;

  return (
    <SidebarProvider>
      <ScheduleEnforcer />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Skip to content
      </a>

      <div className="min-h-dvh flex w-full max-w-full bg-background overflow-visible">
        {/* Sidebar: desktop only */}
        <div className="hidden lg:block">
          <RoleBasedSidebar />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-visible">
          <TopNavbar />

          {/* Study schedule banner */}
          {activeSchedule && !dismissed && (
            <div className="bg-primary/5 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Study time: <strong>{activeSchedule.subject}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => navigate(`/prepare?tab=focus&subject=${encodeURIComponent(activeSchedule.subject)}`)}>
                  <Play className="w-3 h-3 mr-1" />Start
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setDismissed(true)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Breadcrumbs: desktop only */}
          {showBreadcrumbs && (
            <div className="hidden lg:block border-b border-border/40 bg-background/80">
              <div className="px-6 py-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Link to="/dashboard" className="hover:text-foreground transition-colors">
                    <Home className="w-3.5 h-3.5" />
                  </Link>
                  {breadcrumbs.map((bc) => (
                    <span key={bc.path} className="inline-flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                      {bc.isLast ? (
                        <span className="text-foreground font-medium">{bc.label}</span>
                      ) : (
                        <Link to={bc.path} className="hover:text-foreground transition-colors">{bc.label}</Link>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main content — extra bottom padding on mobile for bottom nav */}
          <main id="main-content" className="flex-1 w-full max-w-full overflow-visible px-3 py-3 pb-28 lg:px-5 lg:py-5 lg:pb-5">
            {children}
            <TeacherQuickActionsBar />
          </main>

          <MobileBottomNav />
          <QuickNoteButton />
          <ScrollToTop />
          <OfflineBanner />

        </div>
      </div>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Search pages, tools, and settings..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {commandGroups.map(group => {
            const items = commandItems.filter(i => i.group === group);
            if (!items.length) return null;
            return (
              <CommandGroup key={group} heading={group}>
                {items.map(item => (
                  <CommandItem key={item.url} onSelect={() => { navigate(item.url); setCmdOpen(false); }}>
                    <item.icon className="w-4 h-4 mr-2.5 text-muted-foreground" />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
};
