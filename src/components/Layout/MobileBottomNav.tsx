import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';
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
  const { hidden } = useScrollDirection();

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
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 lg:hidden pointer-events-none',
          'transition-transform duration-300 ease-out will-change-transform',
          hidden ? 'translate-y-[calc(100%+env(safe-area-inset-bottom,0px))]' : 'translate-y-0',
        )}
      >
        <div className="absolute inset-0 bg-nav/80 supports-[backdrop-filter]:bg-nav/70 backdrop-blur-2xl border-t border-border/50 pointer-events-none" />

        <div className="relative flex items-stretch justify-around h-[58px] max-w-lg mx-auto px-1.5 pb-[env(safe-area-inset-bottom,2px)] pointer-events-auto">
          {items.map((item) => {
            const isActive = matchesNavItem(location.pathname, item);
            const isCurr = isCurriculumTab(item.url);
            return (
              <button
                key={item.url}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.title}
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
                  'relative flex flex-col items-center justify-center gap-[2px] flex-1 rounded-[14px] my-1 transition-colors duration-200 active:scale-[0.94] touch-manipulation',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {/* Facebook-style top indicator on the active tab */}
                <span
                  className={cn(
                    'absolute top-0 h-[2.5px] rounded-full bg-primary transition-all duration-300',
                    isActive ? 'w-7 opacity-100' : 'w-0 opacity-0',
                  )}
                />
                <span
                  className={cn(
                    'flex items-center justify-center rounded-[12px] transition-all duration-200',
                    isActive ? 'bg-primary/[0.10] px-3.5 py-1' : 'px-3.5 py-1',
                  )}
                >
                  <item.icon
                    className={cn(
                      'transition-all duration-200',
                      isActive ? 'w-[22px] h-[22px] scale-105' : 'w-[21px] h-[21px]',
                    )}
                    strokeWidth={isActive ? 2.4 : 1.75}
                    fill={isActive ? 'currentColor' : 'none'}
                    fillOpacity={isActive ? 0.14 : 0}
                  />
                </span>
                <span
                  className={cn(
                    'text-[10px] leading-none tracking-[-0.01em] transition-colors duration-150',
                    isActive ? 'font-semibold' : 'font-medium',
                  )}
                >
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
