import { supabase } from './supabase';
import { type GameState, initializeGameState } from './game-state';

export async function createGameState(
  roomId: string,
  players: { guestId: string; displayName: string }[]
): Promise<GameState> {
  const state = initializeGameState(roomId, players);

  const { error } = await supabase.from('game_states').upsert({
    room_id: roomId,
    state,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return state;
}

export async function fetchGameState(
  roomId: string
): Promise<GameState | null> {
  const { data, error } = await supabase
    .from('game_states')
    .select('state')
    .eq('room_id', roomId)
    .single();

  if (error || !data) return null;
  return data.state as GameState;
}

export async function updateGameState(
  roomId: string,
  state: GameState
): Promise<void> {
  const { error } = await supabase
    .from('game_states')
    .update({ state, updated_at: new Date().toISOString() })
    .eq('room_id', roomId);

  if (error) throw error;
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}
