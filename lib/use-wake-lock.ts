'use client';

import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;

    let released = false;

    async function requestWakeLock() {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      } catch {
        // Wake Lock not available
      }
    }

    requestWakeLock();

    // Re-acquire on visibility change
    function handleVisibility() {
      if (!released && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);
}
