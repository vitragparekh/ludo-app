import { type PlayerColor } from './board-data';

export interface PieceState {
  location: 'home' | 'track' | 'column' | 'finished';
  trackPosition?: number;
  columnPosition?: number;
}

export interface PlayerState {
  guestId: string;
  displayName: string;
  color: PlayerColor;
  pieces: [PieceState, PieceState, PieceState, PieceState];
}

export interface GameState {
  roomId: string;
  players: PlayerState[];
  currentPlayerIndex: number;
  diceValue: number | null;
  diceRolled: boolean;
  turnPhase: 'roll' | 'move' | 'waiting';
  winner: string | null; // guestId of winner
  extraTurn: boolean;
}

const PLAYER_COLOR_ORDER: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export function initializeGameState(
  roomId: string,
  players: { guestId: string; displayName: string }[]
): GameState {
  const gamePlayers: PlayerState[] = players.map((p, i) => ({
    guestId: p.guestId,
    displayName: p.displayName,
    color: PLAYER_COLOR_ORDER[i],
    pieces: [
      { location: 'home' },
      { location: 'home' },
      { location: 'home' },
      { location: 'home' },
    ],
  }));

  return {
    roomId,
    players: gamePlayers,
    currentPlayerIndex: 0,
    diceValue: null,
    diceRolled: false,
    turnPhase: 'roll',
    winner: null,
    extraTurn: false,
  };
}
