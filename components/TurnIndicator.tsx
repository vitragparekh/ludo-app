'use client';

import { PLAYER_COLORS, type PlayerColor } from '@/lib/board-data';

interface TurnIndicatorProps {
  currentPlayer: PlayerColor;
  playerName: string;
  isMyTurn: boolean;
}

export function TurnIndicator({
  currentPlayer,
  playerName,
  isMyTurn,
}: TurnIndicatorProps) {
  return (
    <div
      className="w-full py-2 px-4 flex items-center justify-center gap-2 text-white font-medium text-sm"
      style={{ backgroundColor: PLAYER_COLORS[currentPlayer] + '99' }}
    >
      <div
        className="w-6 h-6 rounded-full border-2 border-white/50 shrink-0"
        style={{ backgroundColor: PLAYER_COLORS[currentPlayer] }}
      />
      <span className="truncate">
        {isMyTurn ? 'Your turn!' : `${playerName}'s turn`}
      </span>
    </div>
  );
}
