import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { type GameState, type PieceState } from '@/lib/game-state';
import {
  ENTRY_TILES,
  HOME_ENTRY_TILES,
  SAFE_TILES,
  type PlayerColor,
} from '@/lib/board-data';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { roomId, guestId, pieceIndex, action } = body as {
    roomId: string;
    guestId: string;
    pieceIndex?: number;
    action: 'roll' | 'move';
  };

  // Fetch current game state
  const { data, error } = await supabase
    .from('game_states')
    .select('state')
    .eq('room_id', roomId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const state = data.state as GameState;

  // Verify it's this player's turn
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.guestId !== guestId) {
    return NextResponse.json({ error: 'Not your turn' }, { status: 403 });
  }

  if (action === 'roll') {
    if (state.diceRolled) {
      return NextResponse.json(
        { error: 'Already rolled' },
        { status: 400 }
      );
    }

    const diceValue = Math.floor(Math.random() * 6) + 1;
    const newState: GameState = {
      ...state,
      diceValue,
      diceRolled: true,
      turnPhase: 'move',
    };

    // Check if any valid moves exist
    const hasValidMoves = currentPlayer.pieces.some((piece) =>
      getValidMove(piece, currentPlayer.color, diceValue)
    );

    if (!hasValidMoves) {
      // Auto-advance turn
      const advancedState = advanceTurn(newState);
      await saveState(roomId, advancedState);
      return NextResponse.json({ state: advancedState, diceValue });
    }

    await saveState(roomId, newState);
    return NextResponse.json({ state: newState, diceValue });
  }

  if (action === 'move') {
    if (!state.diceRolled || state.diceValue === null) {
      return NextResponse.json(
        { error: 'Roll dice first' },
        { status: 400 }
      );
    }

    if (pieceIndex === undefined || pieceIndex < 0 || pieceIndex > 3) {
      return NextResponse.json(
        { error: 'Invalid piece' },
        { status: 400 }
      );
    }

    const piece = currentPlayer.pieces[pieceIndex];
    const move = getValidMove(piece, currentPlayer.color, state.diceValue);

    if (!move) {
      return NextResponse.json(
        { error: 'Invalid move' },
        { status: 400 }
      );
    }

    const newState = executeMove(
      state,
      currentPlayer.color,
      pieceIndex,
      move
    );
    await saveState(roomId, newState);
    return NextResponse.json({ state: newState });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function saveState(roomId: string, state: GameState) {
  await supabase
    .from('game_states')
    .update({ state, updated_at: new Date().toISOString() })
    .eq('room_id', roomId);
}

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

  if (move.toColumnIndex !== undefined) {
    piece.location = move.toColumnIndex === 5 ? 'finished' : 'column';
    piece.columnPosition = move.toColumnIndex;
    piece.trackPosition = undefined;
  } else if (move.toTileId !== undefined) {
    piece.location = 'track';
    piece.trackPosition = move.toTileId;
    piece.columnPosition = undefined;

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

  const allFinished = player.pieces.every((p) => p.location === 'finished');
  if (allFinished) {
    newState.winner = player.guestId;
    return newState;
  }

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
  return {
    ...state,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    diceValue: null,
    diceRolled: false,
    turnPhase: 'roll',
    extraTurn: false,
  };
}
