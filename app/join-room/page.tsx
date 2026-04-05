'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getIdentity } from '@/lib/identity';
import { joinRoom } from '@/lib/room';

function JoinRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getIdentity()) router.replace('/identify');
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase().slice(0, 6));
    }
  }, [router, searchParams]);

  function handleCodeChange(value: string) {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 6) {
      setCode(cleaned);
      setError('');
    }
  }

  async function handleJoin() {
    if (code.length !== 6) return;
    const identity = getIdentity();
    if (!identity) return;

    setLoading(true);
    setError('');
    try {
      const result = await joinRoom(code, identity);
      router.push(`/room/${result.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 -mt-14">
      <h1 className="text-2xl font-bold text-white mb-2">Join Room</h1>
      <p className="text-slate-400 mb-8">Enter the 6-character room code</p>

      <input
        type="text"
        inputMode="text"
        value={code}
        onChange={(e) => handleCodeChange(e.target.value)}
        placeholder="ABCDEF"
        maxLength={6}
        className="w-full max-w-xs h-16 px-4 rounded-xl bg-slate-800 border border-slate-600 text-white text-center text-3xl font-mono tracking-[0.3em] placeholder:text-slate-600 focus:outline-none focus:border-blue-500 mb-2"
        autoComplete="off"
        autoCapitalize="characters"
      />

      <p className="text-slate-500 text-xs mb-6">{code.length}/6 characters</p>

      {error && (
        <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
      )}

      <button
        onClick={handleJoin}
        disabled={code.length !== 6 || loading}
        className="w-full max-w-xs h-14 rounded-xl text-lg font-bold bg-blue-600 text-white active:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Joining...' : 'Join'}
      </button>

      <button
        onClick={() => router.back()}
        className="mt-4 text-slate-400 text-sm min-h-[44px] min-w-[44px] active:text-white"
      >
        Back to Lobby
      </button>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center -mt-14">
          <div className="text-slate-400">Loading...</div>
        </div>
      }
    >
      <JoinRoomContent />
    </Suspense>
  );
}
