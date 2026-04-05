import { supabase } from './supabase';
import { type PlayerIdentity, addDuplicateSuffix } from './identity';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createRoom(maxPlayers: number, identity: PlayerIdentity) {
  const code = generateRoomCode();

  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .insert({ code, max_players: maxPlayers, status: 'waiting' })
    .select()
    .single();

  if (roomErr) throw roomErr;

  const { error: playerErr } = await supabase.from('room_players').insert({
    room_id: room.id,
    guest_id: identity.guestId,
    display_name: identity.displayName,
    avatar_color: identity.avatarColor,
    is_manager: true,
  });

  if (playerErr) throw playerErr;

  return { room, code };
}

export async function joinRoom(code: string, identity: PlayerIdentity) {
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (roomErr || !room) {
    throw new Error('Room not found');
  }

  if (room.status !== 'waiting') {
    throw new Error('Game already started');
  }

  const { data: players } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_id', room.id);

  if (players && players.length >= room.max_players) {
    throw new Error('Room is full');
  }

  // Check for duplicate display names
  let displayName = identity.displayName;
  if (players?.some((p) => p.display_name === displayName)) {
    displayName = addDuplicateSuffix(displayName);
  }

  // Check if already in room
  const alreadyJoined = players?.some(
    (p) => p.guest_id === identity.guestId
  );

  if (!alreadyJoined) {
    const { error: joinErr } = await supabase.from('room_players').insert({
      room_id: room.id,
      guest_id: identity.guestId,
      display_name: displayName,
      avatar_color: identity.avatarColor,
      is_manager: false,
    });

    if (joinErr) throw joinErr;
  }

  return { room, code: room.code };
}

export async function leaveRoom(roomId: string, guestId: string) {
  await supabase
    .from('room_players')
    .delete()
    .eq('room_id', roomId)
    .eq('guest_id', guestId);
}

export async function startGame(roomId: string) {
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'playing' })
    .eq('id', roomId);

  if (error) throw error;
}
