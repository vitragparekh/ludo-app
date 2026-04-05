'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getIdentity } from '@/lib/identity';
import { type GameState, type PieceState } from '@/lib/game-state';
import {
  createGameState,
  fetchGameState,
} from '@/lib/game-actions';
import {
  ENTRY_TILES,
  HOME_ENTRY_TILES,
  type PlayerColor,
  PLAYER_COLORS,
} from '@/lib/board-data';
import { LudoBoard } from '@/components/LudoBoard';
import { Dice } from '@/components/Dice';
import { TurnIndicator } from '@/components/TurnIndicator';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState<{
    color: PlayerColor;
    index: number;
  } | null>(null);
  const [rolling, setRolling] = useState(false);

  const identity = getIdentity();

  const loadGame = useCallback(async () => {
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single();

    if (!room) return;

    let state = await fetchGameState(room.id);

    if (!state) {
      const { data: players } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', room.id)
        .order('joined_at', { ascending: true });

      if (players && players.length >= 2) {
        state = await createGameState(
          room.id,
          players.map((p) => ({
            guestId: p.guest_id,
            displayName: p.display_name,
          }))
        );
      }
    }

    if (state) {
      setGameState(state);
    }
    setLoading(false);
  }, [code]);

  useEffect(() => {
    if (!identity) {
      router.replace('/identify');
      return;
    }
    loadGame();
  }, [identity, router, loadGame]);

  // Subscribe to realtime game state changes
  useEffect(() => {
    if (!gameState?.roomId) return;

    const channel = supabase
      .channel(`game-${gameState.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_states',
          filter: `room_id=eq.${gameState.roomId}`,
        },
        (payload) => {
          const newState = (payload.new as { state: GameState }).state;
          setGameState(newState);
          setSelectedPiece(null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameState?.roomId]);

  if (loading || !gameState) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center -mt-14">
        <div className="text-slate-400 text-lg">Loading game...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const myPlayerIndex = gameState.players.findIndex(
    (p) => p.guestId === identity?.guestId
  );
  const myPlayer = myPlayerIndex >= 0 ? gameState.players[myPlayerIndex] : null;
  const isMyTurn = currentPlayer?.guestId === identity?.guestId;

  // Build pieces array for the board
  const pieces = gameState.players.flatMap((player) =>
    player.pieces.map((piece, idx) => ({
      color: player.color,
      pieceIndex: idx,
      location: piece.location,
      trackPosition: piece.trackPosition,
      columnPosition: piece.columnPosition,
    }))
  );

  // Compute valid moves
  const validMoves: {
    pieceColor: PlayerColor;
    pieceIndex: number;
    toTileId?: number;
    toColumnIndex?: number;
  }[] = [];

  if (isMyTurn && gameState.diceRolled && myPlayer && gameState.diceValue) {
    const dice = gameState.diceValue;
    myPlayer.pieces.forEach((piece, idx) => {
      const move = getValidMove(piece, myPlayer.color, dice);
      if (move) {
        validMoves.push({
          pieceColor: myPlayer.color,
          pieceIndex: idx,
          ...move,
        });
      }
    });
  }

  async function handleRoll() {
    if (!isMyTurn || !gameState || gameState.diceRolled || !identity) return;

    setRolling(true);
    try {
      const res = await fetch('/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: gameState.roomId,
          guestId: identity.guestId,
          action: 'roll',
        }),
      });
      const data = await res.json();
      if (res.ok && data.state) {
        setGameState(data.state);
      }
    } catch {
      // Will sync from realtime
    }
    setRolling(false);
  }

  async function handlePieceClick(color: PlayerColor, pieceIndex: number) {
    if (!isMyTurn || !gameState || !gameState.diceRolled || !identity) return;

    const move = validMoves.find(
      (m) => m.pieceColor === color && m.pieceIndex === pieceIndex
    );
    if (!move) return;

    setSelectedPiece({ color, index: pieceIndex });

    try {
      const res = await fetch('/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: gameState.roomId,
          guestId: identity.guestId,
          pieceIndex,
          action: 'move',
        }),
      });
      const data = await res.json();
      if (res.ok && data.state) {
        setGameState(data.state);
      }
    } catch {
      // Will sync from realtime
    }
    setSelectedPiece(null);
  }

  // Winner screen
  if (gameState.winner) {
    const winner = gameState.players.find(
      (p) => p.guestId === gameState.winner
    );
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center -mt-14 px-6">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {winner?.guestId === identity?.guestId
            ? 'You Win!'
            : `${winner?.displayName} Wins!`}
        </h1>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6"
          style={{
            backgroundColor: winner ? PLAYER_COLORS[winner.color] : '#475569',
          }}
        >
          🏆
        </div>
        <button
          onClick={() => router.push('/lobby')}
          className="w-full max-w-xs h-14 rounded-xl text-lg font-bold bg-blue-600 text-white active:bg-blue-700 active:scale-[0.98]"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col -mt-14 pt-14">
      {/* Turn indicator */}
      <TurnIndicator
        currentPlayer={currentPlayer.color}
        playerName={currentPlayer.displayName}
        isMyTurn={isMyTurn}
      />

      {/* Board */}
      <div className="flex-1 flex items-center justify-center px-2">
        <LudoBoard
          pieces={pieces}
          currentPlayer={currentPlayer.color}
          validMoves={validMoves}
          selectedPiece={selectedPiece}
          onPieceClick={handlePieceClick}
          isMyTurn={isMyTurn}
          myColor={myPlayer?.color}
        />
      </div>

      {/* Dice area */}
      <div className="pb-6 pt-2 flex flex-col items-center gap-2">
        {gameState.turnPhase === 'waiting' && !isMyTurn && (
          <p className="text-slate-400 text-sm">Waiting for opponent...</p>
        )}
        {gameState.turnPhase === 'waiting' && isMyTurn && (
          <p className="text-slate-400 text-sm">No valid moves, skipping...</p>
        )}
        <Dice
          value={gameState.diceValue}
          onRoll={handleRoll}
          disabled={!isMyTurn || gameState.diceRolled || rolling}
          rolling={rolling}
        />
        {isMyTurn && !gameState.diceRolled && (
          <p className="text-blue-400 text-sm font-medium">Tap to roll!</p>
        )}
        {isMyTurn && gameState.diceRolled && validMoves.length > 0 && (
          <p className="text-blue-400 text-sm font-medium">
            Tap a piece to move
          </p>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Client-side valid move calculation (for UI highlighting only)
// Actual move validation happens server-side in /api/move
// ────────────────────────────────────────────────

function getValidMove(
  piece: PieceState,
  color: PlayerColor,
  dice: number
): { toTileId?: number; toColumnIndex?: number } | null {
  if (piece.location === 'finished') return null;

  if (piece.location === 'home') {
    if (dice === 6) return { toTileId: ENTRY_TILES[color] };
    return null;
  }

  if (piece.location === 'track' && piece.trackPosition !== undefined) {
    const homeEntry = HOME_ENTRY_TILES[color];
    let current = piece.trackPosition;

    for (let step = 1; step <= dice; step++) {
      current = (current + 1) % 52;
      if (current === (homeEntry + 1) % 52) {
        const remaining = dice - step;
        if (remaining <= 5) return { toColumnIndex: remaining };
        return null;
      }
    }
    return { toTileId: current };
  }

  if (piece.location === 'column' && piece.columnPosition !== undefined) {
    const newColIdx = piece.columnPosition + dice;
    if (newColIdx <= 5) return { toColumnIndex: newColIdx };
    return null;
  }

  return null;
}
