import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { getPrimaryNavigationByRole, matchesNavItem } from '@/components/Sidebar/sidebarConfig';
import { CurriculumSwitcher, getCurrentCurriculum } from '@/components/Curriculum/CurriculumSwitcher';
import { Button } from '@/components/ui/button';

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const role = (profile?.role as string) || 'student';
  const items = getPrimaryNavigationByRole(role).slice(0, 5);
  const [curriculumOpen, setCurriculumOpen] = useState(false);

  const isCurriculumTab = (url: string) => url === '/ecz';
  const current = getCurrentCurriculum();

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pointer-events-none px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <div className="relative flex items-stretch justify-around h-[68px] max-w-md mx-auto p-1.5 pointer-events-auto rounded-full bg-nav/95 supports-[backdrop-filter]:bg-nav/85 backdrop-blur-2xl border border-border/70 shadow-dock">
          {items.map((item) => {
            const matching = items.filter(candidate => matchesNavItem(location.pathname, candidate));
            const exactTab = matching.find(candidate => candidate.url === `${location.pathname}${location.search}`);
            const exactPath = matching.find(candidate => candidate.url === location.pathname);
            const activeItem = exactTab ?? exactPath ?? matching[0];
            const isActive = activeItem?.url === item.url;
            const isCurr = isCurriculumTab(item.url);
            return (
              <Button
                variant="ghost"
                key={item.url}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.title}
                title={item.title}
                onClick={() => {
                  if (isCurr) {
                    setCurriculumOpen(true);
                  } else {
                    navigate(item.url);
                  }
                }}
                className={cn(
                  'relative h-full min-w-0 flex flex-col items-center justify-center gap-1 flex-1 rounded-full px-1 touch-manipulation [&_svg]:size-[21px]',
                  isActive ? 'bg-primary/10 text-primary hover:bg-primary/10' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                  <item.icon
                    aria-hidden="true"
                    strokeWidth={isActive ? 2 : 1.7}
                  />
                <span
                  className={cn(
                    'max-w-full truncate text-[11px] leading-tight transition-colors duration-150',
                    isActive ? 'font-semibold' : 'font-medium',
                  )}
                >
                  {isCurr ? current.code : (item.shortTitle ?? item.title)}
                </span>
              </Button>
            );
          })}
        </div>
      </nav>

      <CurriculumSwitcher open={curriculumOpen} onOpenChange={setCurriculumOpen} />
    </>
  );
};
