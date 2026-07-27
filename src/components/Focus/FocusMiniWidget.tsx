import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, Square, Timer, Coffee } from 'lucide-react';
import { useFocusMode } from '@/hooks/useFocusMode';
import { cn } from '@/lib/utils';

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Always-on floating pill that keeps the Pomodoro / Focus timer visible and
 * controllable from anywhere in the app. The timer itself runs in the global
 * provider, so it keeps counting while the user navigates or backgrounds the tab.
 */
export const FocusMiniWidget: React.FC = () => {
  const { state, pauseResume, stop } = useFocusMode();
  const navigate = useNavigate();
  const location = useLocation();

  const onTimerPage =
    location.pathname.startsWith('/pomodoro') ||
    location.pathname.startsWith('/focus') ||
    location.search.includes('tab=focus') ||
    location.search.includes('tab=pomodoro');

  const visible = state.phase !== 'idle' && !onTimerPage;
  const isBreak = state.phase === 'break' || state.phase === 'longBreak';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed z-40 left-1/2 -translate-x-1/2 bottom-24 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
          style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 backdrop-blur-xl shadow-lg px-1.5 py-1.5">
            <button
              onClick={() => navigate('/pomodoro')}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full hover:bg-muted/60 transition-colors"
              aria-label="Open focus timer"
            >
              <span className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center',
                isBreak ? 'bg-emerald-500/15 text-emerald-600' : 'bg-primary/15 text-primary',
              )}>
                {isBreak ? <Coffee className="w-3.5 h-3.5" /> : <Timer className="w-3.5 h-3.5" />}
              </span>
              <span className="text-left leading-tight">
                <span className="block font-mono text-sm font-semibold tabular-nums text-foreground">
                  {fmt(state.secondsRemaining)}
                </span>
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                  {isBreak ? 'Break' : state.subject || 'Focus'}
                </span>
              </span>
            </button>

            <button
              onClick={pauseResume}
              className="w-8 h-8 rounded-full hover:bg-muted/60 flex items-center justify-center text-muted-foreground"
              aria-label={state.isActive ? 'Pause timer' : 'Resume timer'}
            >
              {state.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={stop}
              className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
              aria-label="Stop timer"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FocusMiniWidget;
