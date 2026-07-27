import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  key: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  allowed_roles: string[];
}

interface FlagContextValue {
  flags: Record<string, FeatureFlag>;
  loading: boolean;
  isEnabled: (key: string) => boolean;
  refresh: () => Promise<void>;
  pilotMode: boolean;
}

const FeatureFlagContext = createContext<FlagContextValue>({
  flags: {},
  loading: true,
  isEnabled: () => false,
  refresh: async () => {},
  pilotMode: false,
});

/** Stable 0-99 bucket from a user id + flag key (deterministic gradual rollout). */
function bucket(userId: string, key: string): number {
  const s = `${userId}:${key}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 100;
}

const OVERRIDE_PREFIX = 'ff_override_';

function readOverride(key: string): boolean | null {
  try {
    const v = localStorage.getItem(OVERRIDE_PREFIX + key);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* ignore */
  }
  return null;
}

export function setFlagOverride(key: string, value: boolean | null) {
  try {
    if (value === null) localStorage.removeItem(OVERRIDE_PREFIX + key);
    else localStorage.setItem(OVERRIDE_PREFIX + key, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<{ userId: string; role: string | null }>({
    userId: 'anonymous',
    role: null,
  });

  const refresh = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('feature_flags')
        .select('key, description, enabled, rollout_percentage, allowed_roles');
      const map: Record<string, FeatureFlag> = {};
      (data ?? []).forEach((f) => {
        map[f.key] = f as FeatureFlag;
      });
      setFlags(map);
    } catch {
      /* flags stay closed on failure */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      let role: string | null = null;
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        role = (profile as { role?: string } | null)?.role ?? null;
      }
      if (!cancelled) setIdentity({ userId: user?.id ?? 'anonymous', role });
    })();
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const isEnabled = useCallback(
    (key: string) => {
      const override = readOverride(key);
      if (override !== null) return override;

      const flag = flags[key];
      if (!flag || !flag.enabled) return false;
      if (flag.allowed_roles?.length && identity.role && !flag.allowed_roles.includes(identity.role)) return false;
      if (flag.rollout_percentage >= 100) return true;
      if (flag.rollout_percentage <= 0) return false;
      return bucket(identity.userId, key) < flag.rollout_percentage;
    },
    [flags, identity],
  );

  const value = useMemo<FlagContextValue>(
    () => ({ flags, loading, isEnabled, refresh, pilotMode: isEnabled('pilot_mode') }),
    [flags, loading, isEnabled, refresh],
  );

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
};

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}

export function useFeatureFlag(key: string): boolean {
  const { isEnabled } = useContext(FeatureFlagContext);
  return isEnabled(key);
}
