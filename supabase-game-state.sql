-- Game state table — stores the full game state as JSONB
create table if not exists game_states (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade unique not null,
  state jsonb not null,
  updated_at timestamptz default now()
);

-- Enable Realtime
alter publication supabase_realtime add table game_states;

-- RLS
alter table game_states enable row level security;
create policy "Allow all on game_states" on game_states for all using (true) with check (true);
