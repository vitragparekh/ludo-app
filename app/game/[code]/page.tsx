'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getIdentity } from '@/lib/identity';
import { type GameState, type PieceState } from '@/lib/game-state';
import {
  createGameState,
  fetchGameState,
  updateGameState,
  rollDice,
} from '@/lib/game-actions';
import {
  ENTRY_TILES,
  HOME_ENTRY_TILES,
  SAFE_TILES,
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
    if (!isMyTurn || !gameState || gameState.diceRolled) return;

    setRolling(true);
    const value = rollDice();

    const newState: GameState = {
      ...gameState,
      diceValue: value,
      diceRolled: true,
      turnPhase: 'move',
    };

    // Check if player has any valid moves
    const currentP = newState.players[newState.currentPlayerIndex];
    const hasValidMoves = currentP.pieces.some((piece) =>
      getValidMove(piece, currentP.color, value)
    );

    if (!hasValidMoves) {
      // No valid moves — skip to next turn after a short delay
      newState.turnPhase = 'waiting';
      await updateGameState(gameState.roomId, newState);
      setGameState(newState);
      setRolling(false);

      setTimeout(async () => {
        const skipState = advanceTurn(newState);
        await updateGameState(gameState.roomId, skipState);
        setGameState(skipState);
      }, 1500);
      return;
    }

    await updateGameState(gameState.roomId, newState);
    setGameState(newState);
    setRolling(false);
  }

  async function handlePieceClick(color: PlayerColor, pieceIndex: number) {
    if (!isMyTurn || !gameState || !gameState.diceRolled) return;

    const move = validMoves.find(
      (m) => m.pieceColor === color && m.pieceIndex === pieceIndex
    );
    if (!move) return;

    setSelectedPiece({ color, index: pieceIndex });

    // Execute the move
    const newState = executeMove(gameState, color, pieceIndex, move);
    await updateGameState(gameState.roomId, newState);
    setGameState(newState);
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
// Move logic helpers
// ────────────────────────────────────────────────

function getValidMove(
  piece: PieceState,
  color: PlayerColor,
  dice: number
): { toTileId?: number; toColumnIndex?: number } | null {
  if (piece.location === 'finished') return null;

  if (piece.location === 'home') {
    if (dice === 6) {
      return { toTileId: ENTRY_TILES[color] };
    }
    return null;
  }

  if (piece.location === 'track' && piece.trackPosition !== undefined) {
    const entryTile = HOME_ENTRY_TILES[color];
    const startTile = ENTRY_TILES[color];
    const pos = piece.trackPosition;

    // Calculate distance from start
    const distFromStart = (pos - startTile + 52) % 52;
    const newDistFromStart = distFromStart + dice;

    if (newDistFromStart > 51 + 6) {
      // Overshoot — can't move
      return null;
    }

    if (newDistFromStart > 51) {
      // Enters home column
      const colIdx = newDistFromStart - 52;
      if (colIdx >= 0 && colIdx <= 5) {
        return { toColumnIndex: colIdx };
      }
      return null;
    }

    // Check if we'd pass through the home entry and need to go into column
    const newPos = (pos + dice) % 52;

    // Check if we cross the home entry tile
    const crossesEntry = doesCrossEntry(pos, dice, entryTile);
    if (crossesEntry) {
      const stepsToEntry = (entryTile - pos + 52) % 52;
      const remaining = dice - stepsToEntry;
      if (remaining > 0 && remaining <= 6) {
        const colIdx = remaining - 1;
        return { toColumnIndex: colIdx };
      }
    }

    return { toTileId: newPos };
  }

  if (piece.location === 'column' && piece.columnPosition !== undefined) {
    const newColIdx = piece.columnPosition + dice;
    if (newColIdx <= 5) {
      return { toColumnIndex: newColIdx };
    }
    return null; // Overshoot
  }

  return null;
}

function doesCrossEntry(
  fromTile: number,
  dice: number,
  entryTile: number
): boolean {
  for (let i = 1; i <= dice; i++) {
    if ((fromTile + i) % 52 === (entryTile + 1) % 52) {
      // We've gone past the entry tile
      return true;
    }
  }
  return false;
}

function executeMove(
  state: GameState,
  color: PlayerColor,
  pieceIndex: number,
  move: { toTileId?: number; toColumnIndex?: number }
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const playerIdx = newState.players.findIndex((p) => p.color === color);
  const player = newState.players[playerIdx];
  const piece = player.pieces[pieceIndex];

  // Execute move
  if (move.toColumnIndex !== undefined) {
    piece.location = move.toColumnIndex === 5 ? 'finished' : 'column';
    piece.columnPosition = move.toColumnIndex;
    piece.trackPosition = undefined;
  } else if (move.toTileId !== undefined) {
    piece.location = 'track';
    piece.trackPosition = move.toTileId;
    piece.columnPosition = undefined;

    // Check for capture
    if (!SAFE_TILES.includes(move.toTileId)) {
      newState.players.forEach((otherPlayer) => {
        if (otherPlayer.color === color) return;
        otherPlayer.pieces.forEach((otherPiece) => {
          if (
            otherPiece.location === 'track' &&
            otherPiece.trackPosition === move.toTileId
          ) {
            otherPiece.location = 'home';
            otherPiece.trackPosition = undefined;
          }
        });
      });
    }
  }

  // Check for win
  const allFinished = player.pieces.every((p) => p.location === 'finished');
  if (allFinished) {
    newState.winner = player.guestId;
    return newState;
  }

  // Extra turn on 6
  if (state.diceValue === 6) {
    newState.diceRolled = false;
    newState.diceValue = null;
    newState.turnPhase = 'roll';
    newState.extraTurn = true;
  } else {
    return advanceTurn(newState);
  }

  return newState;
}

function advanceTurn(state: GameState): GameState {
  const newState = { ...state };
  newState.currentPlayerIndex =
    (state.currentPlayerIndex + 1) % state.players.length;
  newState.diceValue = null;
  newState.diceRolled = false;
  newState.turnPhase = 'roll';
  newState.extraTurn = false;
  return newState;
}
