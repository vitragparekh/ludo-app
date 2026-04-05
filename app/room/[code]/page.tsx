'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getIdentity } from '@/lib/identity';
import { leaveRoom, startGame } from '@/lib/room';
import { AvatarCircle } from '@/components/AvatarCircle';

interface Room {
  id: string;
  code: string;
  max_players: number;
  status: string;
}

interface RoomPlayer {
  id: string;
  room_id: string;
  guest_id: string;
  display_name: string;
  avatar_color: string;
  is_manager: boolean;
}

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const roomIdRef = useRef<string | null>(null);

  const identity = getIdentity();

  const fetchRoom = useCallback(async () => {
    const { data: roomData, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single();

    if (roomErr || !roomData) {
      setError('Room not found');
      setLoading(false);
      return;
    }

    setRoom(roomData);
    roomIdRef.current = roomData.id;

    if (roomData.status === 'playing') {
      router.replace(`/game/${code}`);
      return;
    }

    const { data: playerData } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomData.id)
      .order('joined_at', { ascending: true });

    setPlayers(playerData || []);
    setLoading(false);
  }, [code, router]);

  useEffect(() => {
    if (!identity) {
      router.replace('/identify');
      return;
    }
    fetchRoom();
  }, [identity, router, fetchRoom]);

  // Realtime subscriptions
  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          fetchRoom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
          if (updated.status === 'playing') {
            router.replace(`/game/${code}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, code, router, fetchRoom, room]);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }

  async function handleShare() {
    const shareUrl = `${window.location.origin}/join-room?code=${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Ludo game!',
          text: `Join my Ludo room with code: ${code}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyCode();
    }
  }

  async function handleLeave() {
    if (!identity || !room) return;
    await leaveRoom(room.id, identity.guestId);
    router.push('/lobby');
  }

  async function handleStart() {
    if (!room) return;
    setStarting(true);
    try {
      await startGame(room.id);
    } catch {
      setStarting(false);
    }
  }

  const isManager = players.some(
    (p) => p.guest_id === identity?.guestId && p.is_manager
  );
  const canStart = players.length >= 2;

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center -mt-14">
        <div className="text-slate-400 text-lg">Loading room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center -mt-14 px-6">
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button
          onClick={() => router.push('/lobby')}
          className="text-blue-400 min-h-[44px] active:text-blue-300"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-6 -mt-14 pt-20">
      {/* Room code */}
      <p className="text-slate-400 text-sm mb-1">Room Code</p>
      <button
        onClick={handleCopyCode}
        className="text-4xl font-mono font-bold text-white tracking-[0.3em] mb-1 min-h-[44px] active:text-blue-400 transition-colors"
      >
        {code}
      </button>
      <p className="text-slate-500 text-xs mb-4">
        {copied ? 'Copied!' : 'Tap to copy'}
      </p>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="mb-8 px-6 h-11 rounded-lg bg-slate-700 text-white text-sm font-medium active:bg-slate-600 border border-slate-600"
      >
        Share Invite
      </button>

      {/* Players list */}
      <div className="w-full max-w-sm mb-8">
        <p className="text-slate-400 text-sm mb-3">
          Players ({players.length}/{room?.max_players})
        </p>
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 bg-slate-800 rounded-xl p-3 border border-slate-700"
            >
              <AvatarCircle
                color={player.avatar_color}
                name={player.display_name}
                size={44}
              />
              <span className="text-white font-medium flex-1 truncate">
                {player.display_name}
              </span>
              {player.is_manager && (
                <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full font-medium">
                  Manager
                </span>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {room &&
            Array.from(
              { length: room.max_players - players.length },
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 border-dashed"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center">
                    <span className="text-slate-500 text-lg">?</span>
                  </div>
                  <span className="text-slate-500">Waiting for player...</span>
                </div>
              )
            )}
        </div>
      </div>

      {/* Action buttons */}
      {isManager ? (
        <button
          onClick={handleStart}
          disabled={!canStart || starting}
          className="w-full max-w-sm h-14 rounded-xl text-lg font-bold bg-green-600 text-white active:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {starting
            ? 'Starting...'
            : canStart
              ? 'Start Game'
              : 'Need at least 2 players'}
        </button>
      ) : (
        <p className="text-slate-400 text-sm text-center">
          Waiting for manager to start...
        </p>
      )}

      <button
        onClick={handleLeave}
        className="mt-4 text-red-400 text-sm min-h-[44px] active:text-red-300"
      >
        Leave Room
      </button>
    </div>
  );
}
