import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface TimeCapsule {
  path: string;
  scrollY: number;
  scrollX: number;
  formData: Record<string, string>;
  activeTab?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

const DB_NAME = 'edu-zambia-timecapsules';
const STORE_NAME = 'capsules';
const MAX_CAPSULES = 50;

function openCapsuleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function useTimeCapsule() {
  const location = useLocation();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const restoredRef = useRef<Set<string>>(new Set());

  // Capture current form state from the page
  const captureFormData = useCallback((): Record<string, string> => {
    const data: Record<string, string> = {};
    const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      '#main-content input, #main-content textarea, #main-content select'
    );
    inputs.forEach((el, i) => {
      const key = el.name || el.id || `field-${i}`;
      if (el.type !== 'password' && el.type !== 'hidden') {
        data[key] = el.value;
      }
    });
    return data;
  }, []);

  // Capture active tab
  const captureActiveTab = useCallback((): string | undefined => {
    const activeTab = document.querySelector('[data-state="active"][role="tab"]');
    return activeTab?.getAttribute('data-value') || activeTab?.textContent || undefined;
  }, []);

  // Save capsule
  const saveCapsule = useCallback(async (extraMeta?: Record<string, any>) => {
    try {
      const db = await openCapsuleDB();
      const capsule: TimeCapsule = {
        path: location.pathname + location.search,
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        formData: captureFormData(),
        activeTab: captureActiveTab(),
        timestamp: Date.now(),
        metadata: extraMeta,
      };
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(capsule);
    } catch {}
  }, [location.pathname, location.search, captureFormData, captureActiveTab]);

  // Restore capsule
  const restoreCapsule = useCallback(async (): Promise<TimeCapsule | null> => {
    try {
      const db = await openCapsuleDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const key = location.pathname + location.search;
      const req = tx.objectStore(STORE_NAME).get(key);
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }, [location.pathname, location.search]);

  // Auto-save on scroll/input changes (debounced)
  useEffect(() => {
    const debouncedSave = () => {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveCapsule(), 2000);
    };

    window.addEventListener('scroll', debouncedSave, { passive: true });
    document.addEventListener('input', debouncedSave);

    return () => {
      window.removeEventListener('scroll', debouncedSave);
      document.removeEventListener('input', debouncedSave);
      clearTimeout(saveTimerRef.current);
      // Save on leave
      saveCapsule();
    };
  }, [saveCapsule]);

  // Auto-restore on mount
  useEffect(() => {
    const fullPath = location.pathname + location.search;
    if (restoredRef.current.has(fullPath)) return;
    restoredRef.current.add(fullPath);

    const restore = async () => {
      const capsule = await restoreCapsule();
      if (!capsule || Date.now() - capsule.timestamp > 24 * 60 * 60 * 1000) return; // expire after 24h

      // Restore form data only. Restoring scroll caused route changes to feel
      // locked on mobile because it fought the global ScrollToTop behavior.
      setTimeout(() => {
        Object.entries(capsule.formData).forEach(([key, value]) => {
          const el = document.querySelector<HTMLInputElement>(
            `#main-content [name="${key}"], #main-content [id="${key}"]`
          );
          if (el && !el.value) {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      }, 500);
    };

    restore();
  }, [location.pathname, location.search, restoreCapsule]);

  // Manual save with extra metadata
  const createCapsule = useCallback((meta?: Record<string, any>) => {
    return saveCapsule(meta);
  }, [saveCapsule]);

  // Clear all capsules
  const clearAllCapsules = useCallback(async () => {
    try {
      const db = await openCapsuleDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    } catch {}
  }, []);

  return { createCapsule, restoreCapsule, clearAllCapsules };
}
