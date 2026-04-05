'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getIdentity } from '@/lib/identity';
import { createRoom } from '@/lib/room';

const PLAYER_OPTIONS = [2, 3, 4] as const;

export default function CreateRoomPage() {
  const router = useRouter();
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getIdentity()) router.replace('/identify');
  }, [router]);

  async function handleCreate() {
    const identity = getIdentity();
    if (!identity) return;

    setLoading(true);
    setError('');
    try {
      const { code } = await createRoom(maxPlayers, identity);
      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 -mt-14">
      <h1 className="text-2xl font-bold text-white mb-2">Create Room</h1>
      <p className="text-slate-400 mb-8">How many players?</p>

      <div className="flex gap-3 mb-8">
        {PLAYER_OPTIONS.map((n) => (
          <button
            key={n}
            onClick={() => setMaxPlayers(n)}
            className={`w-20 h-20 rounded-xl text-2xl font-bold transition-all active:scale-95 ${
              maxPlayers === n
                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                : 'bg-slate-700 text-slate-300 border border-slate-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <p className="text-slate-400 text-sm mb-6">
        {maxPlayers} player{maxPlayers > 1 ? 's' : ''} game
      </p>

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full max-w-xs h-14 rounded-xl text-lg font-bold bg-blue-600 text-white active:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Room'}
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
