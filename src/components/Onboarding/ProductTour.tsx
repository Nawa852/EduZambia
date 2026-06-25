import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

const TOUR_KEY = 'nexus_student_tour_v1';

const studentSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome to Nexus Learning 🎓',
    content: 'Your AI-powered ECZ study companion. Let me show you around in 60 seconds.',
  },
  {
    target: '[data-tour="streak"]',
    title: 'Study streaks 🔥',
    content: 'Study a little every day to grow your streak and earn XP.',
  },
  {
    target: '[data-tour="study-plan"]',
    title: 'Your daily plan',
    content: 'Your next lesson is always one click away. Tap Start Session to dive in.',
  },
  {
    target: '[data-tour="quick-tools"]',
    title: 'Quick tools',
    content: 'Quick capture, Periodic Table, Calculator and AI Assistant — one tap.',
  },
  {
    target: '[data-tour="ai-shortcuts"]',
    title: 'AI shortcuts ✨',
    content: 'Snap & solve homework, voice tutor, essay coach, translate — all in one place.',
  },
  {
    target: '[data-tour="upcoming"]',
    title: 'Upcoming classes',
    content: 'Live classes show join links. Subscribe to your iCal feed for your phone calendar.',
  },
];

const TOURS: Record<string, Step[]> = {
  student: studentSteps,
};

export function ProductTour({ role = 'student' as keyof typeof TOURS }: { role?: keyof typeof TOURS }) {
  const [run, setRun] = useState(false);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const forced = params.get('tour') === '1';
    const done = localStorage.getItem(TOUR_KEY);
    if (forced || !done) {
      // delay so DOM is mounted
      const t = setTimeout(() => setRun(true), 400);
      return () => clearTimeout(t);
    }
  }, [params]);

  const cb = (data: CallBackProps) => {
    const finished: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finished.includes(data.status)) {
      localStorage.setItem(TOUR_KEY, '1');
      setRun(false);
      if (params.get('tour')) { params.delete('tour'); setParams(params, { replace: true }); }
    }
  };

  return (
    <Joyride
      steps={TOURS[role] || studentSteps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={cb}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--card))',
          arrowColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0,0,0,0.55)',
          zIndex: 9999,
        },
        tooltip: { borderRadius: 16, padding: 16 },
        buttonNext: { borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 600 },
        buttonBack: { fontSize: 12, color: 'hsl(var(--muted-foreground))' },
        buttonSkip: { fontSize: 12, color: 'hsl(var(--muted-foreground))' },
      }}
    />
  );
}

export function resetTour() {
  localStorage.removeItem(TOUR_KEY);
}
