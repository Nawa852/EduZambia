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
        <div className="absolute inset-0 bg-background/95 backdrop-blur-xl border-t border-border/40 pointer-events-none" />

        <div className="relative flex items-center justify-around h-[64px] max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom,2px)] pointer-events-auto">
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
                   'relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors duration-150 active:scale-95 touch-manipulation',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                   'flex items-center justify-center w-14 h-8 rounded-2xl transition-colors duration-150',
                  isActive ? 'bg-primary/12 shadow-sm shadow-primary/10' : 'bg-transparent'
                )}>
                  <item.icon
                    className={cn(
                       "w-[20px] h-[20px] transition-colors duration-150",
                      isActive && "text-primary scale-105"
                    )}
                    strokeWidth={isActive ? 2.4 : 1.5}
                  />
                </div>

                <span className={cn(
                   "text-[10px] leading-none transition-colors duration-150 mt-0.5",
                  isActive ? "font-bold text-primary" : "font-medium text-muted-foreground/70"
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

