import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Timer, Play, Pause, Square, Coffee, Brain, Volume2, VolumeX, Settings2 } from 'lucide-react';
import { useFocusMode } from '@/hooks/useFocusMode';

const SUBJECTS = ['General', 'Mathematics', 'Science', 'English', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'ICT'];

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const PomodoroPage = () => {
  const { state, settings, startFocus, startBreak, pauseResume, stop, updateSettings, getDailyStats } = useFocusMode();
  const [subject, setSubject] = useState('General');
  const [showSettings, setShowSettings] = useState(false);
  const stats = getDailyStats();

  const phaseSeconds = useMemo(() => {
    if (state.phase === 'focus') return settings.focusMinutes * 60;
    if (state.phase === 'break') return settings.breakMinutes * 60;
    if (state.phase === 'longBreak') return settings.longBreakMinutes * 60;
    return settings.focusMinutes * 60;
  }, [state.phase, settings]);

  const remaining = state.phase === 'idle' ? phaseSeconds : state.secondsRemaining;
  const progress = Math.min(100, Math.max(0, ((phaseSeconds - remaining) / phaseSeconds) * 100));
  const isBreak = state.phase === 'break' || state.phase === 'longBreak';

  const R = 132;
  const C = 2 * Math.PI * R;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Focus Timer</h1>
        <p className="text-sm text-muted-foreground">
          Keeps running in the background — switch pages or minimise the app.
        </p>
      </div>

      <Card className="border-border/50 rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-center">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
              {isBreak ? <Coffee className="w-3 h-3 mr-1.5" /> : <Brain className="w-3 h-3 mr-1.5" />}
              {state.phase === 'idle' ? 'Ready' : state.phase === 'focus' ? `Focusing · ${state.subject}` : state.phase === 'break' ? 'Short break' : 'Long break'}
            </Badge>
          </div>

          <div className="relative mx-auto w-[300px] h-[300px] max-w-full">
            <svg viewBox="0 0 300 300" className="w-full h-full -rotate-90">
              <circle cx="150" cy="150" r={R} fill="none" strokeWidth="10"
                className="stroke-muted/50" />
              <motion.circle
                cx="150" cy="150" r={R} fill="none" strokeWidth="10" strokeLinecap="round"
                className={isBreak ? 'stroke-emerald-500' : 'stroke-primary'}
                strokeDasharray={C}
                animate={{ strokeDashoffset: C - (C * progress) / 100 }}
                transition={{ duration: 0.6, ease: 'linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-6xl font-semibold tabular-nums tracking-tight text-foreground">
                {fmt(remaining)}
              </span>
              <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {state.phase === 'idle' ? 'Tap start' : state.isActive ? 'Running' : 'Paused'}
              </span>
            </div>
          </div>

          {state.phase === 'idle' ? (
            <div className="space-y-3">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="lg" className="flex-1 rounded-xl" onClick={() => startFocus(subject)}>
                  <Play className="w-4 h-4 mr-2" />Start focus
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl" onClick={() => startBreak(false)}>
                  <Coffee className="w-4 h-4 mr-2" />Break
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="lg" className="flex-1 rounded-xl" onClick={pauseResume}>
                {state.isActive ? <><Pause className="w-4 h-4 mr-2" />Pause</> : <><Play className="w-4 h-4 mr-2" />Resume</>}
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl" onClick={stop}>
                <Square className="w-4 h-4 mr-2" />End
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowSettings(s => !s)}>
              <Settings2 className="w-4 h-4 mr-1.5" />Settings
            </Button>
            <Button variant="ghost" size="icon" onClick={() => updateSettings({ soundOn: !settings.soundOn })}
              aria-label={settings.soundOn ? 'Mute alerts' : 'Unmute alerts'}>
              {settings.soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>

          {showSettings && (
            <div className="space-y-4 rounded-2xl bg-muted/40 p-4">
              {([
                ['Focus', 'focusMinutes', 5, 90, 5],
                ['Short break', 'breakMinutes', 1, 30, 1],
                ['Long break', 'longBreakMinutes', 5, 45, 5],
                ['Sessions before long break', 'sessionsBeforeLongBreak', 2, 8, 1],
              ] as const).map(([label, key, min, max, step]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{settings[key]}</span>
                  </div>
                  <Slider value={[settings[key]]} min={min} max={max} step={step}
                    onValueChange={v => updateSettings({ [key]: v[0] } as any)}
                    disabled={state.phase !== 'idle'} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Sessions today', value: stats.sessions },
          { label: 'Minutes focused', value: Math.round(stats.totalSeconds / 60) },
          { label: 'Given up', value: stats.giveUps },
        ].map(s => (
          <Card key={s.label} className="border-border/50 rounded-2xl">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-semibold text-foreground tabular-nums">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PomodoroPage;
