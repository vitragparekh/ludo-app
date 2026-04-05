'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getIdentity, clearIdentity, type PlayerIdentity } from '@/lib/identity';
import { AvatarCircle } from './AvatarCircle';

export function TopBar() {
  const [identity, setIdentity] = useState<PlayerIdentity | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIdentity(getIdentity());
  }, [pathname]);

  if (!identity || pathname === '/identify') return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <AvatarCircle color={identity.avatarColor} name={identity.displayName} size={36} />
        <span className="text-white font-medium text-sm truncate max-w-[160px]">
          {identity.displayName}
        </span>
      </div>
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
  );
}
