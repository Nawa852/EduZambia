import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { getPrimaryNavigationByRole, matchesNavItem } from '@/components/Sidebar/sidebarConfig';
import { CurriculumSwitcher, getCurrentCurriculum } from '@/components/Curriculum/CurriculumSwitcher';

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const role = (profile?.role as string) || 'student';
  const items = getPrimaryNavigationByRole(role).slice(0, 5);
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const pressTimer = useRef<number | null>(null);

  const isCurriculumTab = (url: string) => url === '/ecz';
  const current = getCurrentCurriculum();

  const handlePressStart = (url: string) => {
    if (!isCurriculumTab(url)) return;
    pressTimer.current = window.setTimeout(() => {
      setCurriculumOpen(true);
      pressTimer.current = null;
    }, 450);
  };
  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pointer-events-none">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl border-t border-border/30 pointer-events-none" />

        <div className="relative flex items-stretch justify-around h-[58px] max-w-lg mx-auto px-1 pb-[env(safe-area-inset-bottom,2px)] pointer-events-auto">
          {items.map((item) => {
            const isActive = matchesNavItem(location.pathname, item);
            const isCurr = isCurriculumTab(item.url);
            return (
              <button
                key={item.url}
                onClick={() => {
                  if (isCurr) {
                    setCurriculumOpen(true);
                  } else {
                    navigate(item.url);
                  }
                }}
                onMouseDown={() => handlePressStart(item.url)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart(item.url)}
                onTouchEnd={handlePressEnd}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 flex-1 transition-colors duration-150 active:opacity-60 touch-manipulation',
                  isActive ? 'text-primary' : 'text-muted-foreground/70'
                )}
              >
                <item.icon
                  className="w-[22px] h-[22px] transition-colors duration-150"
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                <span className={cn(
                  "text-[10px] leading-none tracking-[-0.01em] transition-colors duration-150",
                  isActive ? "font-semibold" : "font-medium"
                )}>
                  {isCurr ? current.code : (item.shortTitle ?? item.title)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>


      <CurriculumSwitcher open={curriculumOpen} onOpenChange={setCurriculumOpen} />
    </>
  );
};

