import React, { useEffect, useRef } from 'react';

declare global {
  interface Window { JitsiMeetExternalAPI: any }
}

interface Props {
  roomCode: string;
  displayName?: string;
  onLeave?: () => void;
  height?: number | string;
}

const SCRIPT_SRC = 'https://meet.jit.si/external_api.js';

const ensureScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve();
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject());
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Jitsi'));
    document.body.appendChild(s);
  });

export const JitsiRoom: React.FC<Props> = ({ roomCode, displayName, onLeave, height = 600 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    ensureScript()
      .then(() => {
        if (!mounted || !containerRef.current) return;
        apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName: roomCode,
          parentNode: containerRef.current,
          width: '100%',
          height,
          userInfo: { displayName: displayName || 'Synapse Learner' },
          configOverwrite: { prejoinPageEnabled: false, startWithAudioMuted: true },
          interfaceConfigOverwrite: { MOBILE_APP_PROMO: false },
        });
        apiRef.current.addEventListener('readyToClose', () => onLeave?.());
      })
      .catch(console.error);
    return () => {
      mounted = false;
      try { apiRef.current?.dispose(); } catch {}
    };
  }, [roomCode, displayName, height, onLeave]);

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden bg-black" style={{ minHeight: height }} />;
};

export default JitsiRoom;
