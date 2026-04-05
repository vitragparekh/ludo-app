'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  getIdentity,
  clearIdentity,
  type PlayerIdentity,
} from '@/lib/identity';
import { isMuted, toggleMute } from '@/lib/sounds';
import { AvatarCircle } from './AvatarCircle';

export function TopBar() {
  const [identity, setIdentity] = useState<PlayerIdentity | null>(null);
  const [muted, setMuted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIdentity(getIdentity());
    setMuted(isMuted());
  }, [pathname]);

  if (!identity || pathname === '/identify') return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <AvatarCircle
          color={identity.avatarColor}
          name={identity.displayName}
          size={36}
        />
        <span className="text-white font-medium text-sm truncate max-w-[120px]">
          {identity.displayName}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setMuted(toggleMute())}
          className="text-slate-400 text-lg min-w-[44px] min-h-[44px] flex items-center justify-center active:text-white"
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <button
          onClick={() => {
            clearIdentity();
            router.push('/identify');
          }}
          className="text-slate-400 text-sm min-w-[44px] min-h-[44px] flex items-center justify-center active:text-white"
        >
          Change
        </button>
      </div>
    </div>
  );
}
