import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FocusPhase = 'idle' | 'focus' | 'break' | 'longBreak';

export interface FocusSettings {
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  soundOn: boolean;
}

interface PersistedState {
  phase: FocusPhase;
  isActive: boolean;
  /** epoch ms when the current phase ends (only meaningful while running) */
  endsAt: number | null;
  /** seconds left, used while paused */
  pausedRemaining: number;
  sessionsCompleted: number;
  totalFocusSeconds: number;
  startedAt: string | null;
  subject: string;
}

export interface FocusState extends Omit<PersistedState, 'startedAt' | 'endsAt' | 'pausedRemaining'> {
  secondsRemaining: number;
  startedAt: Date | null;
  currentSessionId: string | null;
}

const DEFAULT_SETTINGS: FocusSettings = {
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  soundOn: true,
};

const STATE_KEY = 'focus-runtime-v2';
const SETTINGS_KEY = 'focus-settings';

const EMPTY: PersistedState = {
  phase: 'idle',
  isActive: false,
  endsAt: null,
  pausedRemaining: 0,
  sessionsCompleted: 0,
  totalFocusSeconds: 0,
  startedAt: null,
  subject: '',
};

function loadSettings(): FocusSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as PersistedState & { day?: string };
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.day && parsed.day !== today) {
      return { ...EMPTY };
    }
    return { ...EMPTY, ...parsed };
  } catch { return EMPTY; }
}

function remainingSeconds(s: PersistedState): number {
  if (s.phase === 'idle') return 0;
  if (!s.isActive) return Math.max(0, Math.round(s.pausedRemaining));
  if (!s.endsAt) return 0;
  return Math.max(0, Math.round((s.endsAt - Date.now()) / 1000));
}

function beep(enabled: boolean) {
  if (!enabled) return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start();
    osc.stop(ctx.currentTime + 0.85);
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch { /* audio unavailable */ }
}

function notify(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/pwa-192x192.png' });
    }
  } catch { /* ignore */ }
}

interface FocusContextValue {
  state: FocusState;
  settings: FocusSettings;
  startFocus: (subject?: string) => void;
  startBreak: (long?: boolean) => void;
  pauseResume: () => void;
  stop: () => void;
  giveUp: () => number;
  updateSettings: (partial: Partial<FocusSettings>) => void;
  getDailyStats: () => { sessions: number; totalSeconds: number; giveUps: number };
}

const FocusContext = createContext<FocusContextValue | null>(null);

export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<FocusSettings>(loadSettings);
  const [persisted, setPersisted] = useState<PersistedState>(loadState);
  const [tick, setTick] = useState(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const persistedRef = useRef(persisted);
  persistedRef.current = persisted;

  // persist settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // persist runtime state (so the timer survives navigation, reloads and app restarts)
  useEffect(() => {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({ ...persisted, day: new Date().toISOString().slice(0, 10) }),
    );
  }, [persisted]);

  // daily stats mirror
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(
      `focus-stats-${today}`,
      JSON.stringify({ sessions: persisted.sessionsCompleted, totalSeconds: persisted.totalFocusSeconds }),
    );
  }, [persisted.sessionsCompleted, persisted.totalFocusSeconds]);

  const saveSessionToDB = useCallback(async (
    subject: string, focusMinutes: number, sessionsCompleted: number,
    gaveUp: boolean, startedAt: Date, distractionCount = 0,
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('focus_sessions' as any).insert({
        user_id: user.id,
        subject: subject || 'General',
        focus_minutes: focusMinutes,
        sessions_completed: sessionsCompleted,
        gave_up: gaveUp,
        started_at: startedAt.toISOString(),
        ended_at: new Date().toISOString(),
        distraction_count: distractionCount,
      });
    } catch (err) {
      console.error('Failed to save focus session', err);
    }
  }, []);

  /** Advance the phase when the deadline passes. Deadline-based, so it stays
   *  accurate even when the tab is backgrounded and intervals are throttled. */
  const settle = useCallback(() => {
    const s = persistedRef.current;
    if (s.phase === 'idle' || !s.isActive || !s.endsAt) return;
    if (Date.now() < s.endsAt) return;

    const cfg = settingsRef.current;
    beep(cfg.soundOn);

    if (s.phase === 'focus') {
      const nextSessions = s.sessionsCompleted + 1;
      const isLong = nextSessions % cfg.sessionsBeforeLongBreak === 0;
      if (s.startedAt) {
        saveSessionToDB(s.subject, cfg.focusMinutes, 1, false, new Date(s.startedAt));
      }
      notify('Focus complete', `Session #${nextSessions} done — take a ${isLong ? 'long ' : ''}break.`);
      setPersisted({
        ...s,
        phase: isLong ? 'longBreak' : 'break',
        endsAt: Date.now() + (isLong ? cfg.longBreakMinutes : cfg.breakMinutes) * 60_000,
        pausedRemaining: (isLong ? cfg.longBreakMinutes : cfg.breakMinutes) * 60,
        sessionsCompleted: nextSessions,
        totalFocusSeconds: s.totalFocusSeconds + cfg.focusMinutes * 60,
        startedAt: new Date().toISOString(),
      });
    } else {
      notify('Break over', 'Time to focus again.');
      setPersisted({
        ...s,
        phase: 'focus',
        endsAt: Date.now() + cfg.focusMinutes * 60_000,
        pausedRemaining: cfg.focusMinutes * 60,
        startedAt: new Date().toISOString(),
      });
    }
  }, [saveSessionToDB]);

  // ticking + background catch-up
  useEffect(() => {
    const id = setInterval(() => {
      settle();
      setTick(t => t + 1);
    }, 1000);
    const onVisible = () => { settle(); setTick(t => t + 1); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [settle]);

  // keep other tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STATE_KEY && e.newValue) {
        try { setPersisted({ ...EMPTY, ...JSON.parse(e.newValue) }); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const startFocus = useCallback((subject = 'General') => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    const mins = settingsRef.current.focusMinutes;
    setPersisted(prev => ({
      ...prev,
      phase: 'focus',
      isActive: true,
      endsAt: Date.now() + mins * 60_000,
      pausedRemaining: mins * 60,
      startedAt: new Date().toISOString(),
      subject,
    }));
  }, []);

  const startBreak = useCallback((long = false) => {
    const cfg = settingsRef.current;
    const mins = long ? cfg.longBreakMinutes : cfg.breakMinutes;
    setPersisted(prev => ({
      ...prev,
      phase: long ? 'longBreak' : 'break',
      isActive: true,
      endsAt: Date.now() + mins * 60_000,
      pausedRemaining: mins * 60,
      startedAt: new Date().toISOString(),
    }));
  }, []);

  const pauseResume = useCallback(() => {
    setPersisted(prev => {
      if (prev.phase === 'idle') return prev;
      if (prev.isActive) {
        return { ...prev, isActive: false, pausedRemaining: remainingSeconds(prev), endsAt: null };
      }
      return { ...prev, isActive: true, endsAt: Date.now() + prev.pausedRemaining * 1000 };
    });
  }, []);

  const stop = useCallback(() => {
    const s = persistedRef.current;
    if (s.phase === 'focus' && s.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 60000);
      if (elapsed > 0) saveSessionToDB(s.subject, elapsed, 0, false, new Date(s.startedAt));
    }
    setPersisted(prev => ({
      ...prev, phase: 'idle', isActive: false, endsAt: null, pausedRemaining: 0,
      startedAt: null, subject: '',
    }));
  }, [saveSessionToDB]);

  const giveUp = useCallback(() => {
    const s = persistedRef.current;
    if (s.startedAt) {
      const elapsed = Math.max(1, Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 60000));
      saveSessionToDB(s.subject, elapsed, 0, true, new Date(s.startedAt));
    }
    setPersisted(prev => ({
      ...prev, phase: 'idle', isActive: false, endsAt: null, pausedRemaining: 0,
      startedAt: null, subject: '',
    }));
    const today = new Date().toISOString().slice(0, 10);
    const key = `focus-giveups-${today}`;
    const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    localStorage.setItem(key, String(count));
    return count;
  }, [saveSessionToDB]);

  const updateSettings = useCallback((partial: Partial<FocusSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const getDailyStats = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    let stats = { sessions: 0, totalSeconds: 0 };
    try { stats = JSON.parse(localStorage.getItem(`focus-stats-${today}`) || '{"sessions":0,"totalSeconds":0}'); } catch { /* ignore */ }
    const giveUps = parseInt(localStorage.getItem(`focus-giveups-${today}`) || '0', 10);
    return { ...stats, giveUps };
  }, []);

  const state: FocusState = useMemo(() => ({
    phase: persisted.phase,
    isActive: persisted.isActive,
    secondsRemaining: remainingSeconds(persisted),
    sessionsCompleted: persisted.sessionsCompleted,
    totalFocusSeconds: persisted.totalFocusSeconds,
    subject: persisted.subject,
    startedAt: persisted.startedAt ? new Date(persisted.startedAt) : null,
    currentSessionId: null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [persisted, tick]);

  const value = useMemo(() => ({
    state, settings, startFocus, startBreak, pauseResume, stop, giveUp, updateSettings, getDailyStats,
  }), [state, settings, startFocus, startBreak, pauseResume, stop, giveUp, updateSettings, getDailyStats]);

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
};

export function useFocusMode(): FocusContextValue {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocusMode must be used inside FocusModeProvider');
  return ctx;
}
