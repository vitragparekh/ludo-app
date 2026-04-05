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
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 -mt-14 gap-6">
      <h1 className="text-3xl font-bold text-white mb-4">Ludo Online</h1>

      <button
        onClick={() => router.push('/create-room')}
        className="w-full max-w-xs h-16 rounded-xl text-lg font-bold bg-blue-600 text-white active:bg-blue-700 active:scale-[0.98] transition-all"
      >
        Create Room
      </button>

      <button
        onClick={() => router.push('/join-room')}
        className="w-full max-w-xs h-16 rounded-xl text-lg font-bold bg-slate-700 text-white active:bg-slate-600 active:scale-[0.98] transition-all border border-slate-600"
      >
        Join Room
      </button>
    </div>
  );
}
