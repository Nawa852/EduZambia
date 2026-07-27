import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const KEY_PREFIX = 'synapse_seeded_';

/**
 * Ensures every new account lands on populated pages instead of empty shells.
 * Runs once per user (idempotent server-side too).
 */
export function useStarterSeed(userId?: string | null, onSeeded?: () => void) {
  const ran = useRef(false);

  useEffect(() => {
    if (!userId || ran.current) return;
    const key = KEY_PREFIX + userId;
    if (localStorage.getItem(key)) return;
    ran.current = true;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('seed-starter-data', { body: {} });
        if (!error) {
          localStorage.setItem(key, '1');
          if (data && (data as { skipped?: boolean }).skipped === false) onSeeded?.();
        }
      } catch {
        /* seeding is best-effort */
      }
    })();
  }, [userId, onSeeded]);
}
