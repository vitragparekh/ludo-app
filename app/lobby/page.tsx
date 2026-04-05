'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getIdentity } from '@/lib/identity';

export default function LobbyPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getIdentity()) {
      router.replace('/identify');
    }
  }, [router]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 -mt-14">
      <h1 className="text-2xl font-bold text-white mb-8">Lobby</h1>
      <p className="text-slate-400 mb-8">Room system coming in Phase 3</p>
    </div>
  );
}
