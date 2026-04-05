-- Rooms table
create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  code char(6) unique not null,
  max_players int not null check (max_players between 2 and 4),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  created_at timestamptz default now()
);

-- Room players table
create table if not exists room_players (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  guest_id text not null,
  display_name text not null,
  avatar_color text not null,
  is_manager boolean default false,
  joined_at timestamptz default now(),
  unique(room_id, guest_id)
);

-- Enable Realtime on both tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_players;

-- Row Level Security: allow all operations for anon (guest-only app)
alter table rooms enable row level security;
alter table room_players enable row level security;

create policy "Allow all on rooms" on rooms for all using (true) with check (true);
create policy "Allow all on room_players" on room_players for all using (true) with check (true);
