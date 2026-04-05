'use client';

import { useParams } from 'next/navigation';

export default function GamePage() {
  const params = useParams();
  const code = params.code as string;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 -mt-14">
      <h1 className="text-2xl font-bold text-white mb-4">Game</h1>
      <p className="text-slate-400">Room {code} — Board coming in Phase 4</p>
    </div>
  );
}
