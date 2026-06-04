-- Rooms
create table rooms (
  id            text primary key,
  status        text not null check (status in ('waiting', 'playing', 'finished')),
  target_score  int  not null default 100,
  created_at    timestamptz default now(),
  host_player_id uuid
);

-- Players
create table players (
  id            uuid primary key default gen_random_uuid(),
  room_id       text references rooms(id) on delete cascade,
  seat          int  not null check (seat between 0 and 3),
  name          text not null,
  team          int  not null check (team in (0, 1)),
  joined_at     timestamptz default now(),
  last_seen     timestamptz default now(),
  connected     boolean default true,
  unique(room_id, seat)
);

-- Moves (append-only log)
create table moves (
  id            bigserial primary key,
  room_id       text references rooms(id) on delete cascade,
  player_id     uuid references players(id),
  seq           int  not null,
  type          text not null check (type in ('deal', 'play_tile', 'pass', 'round_end', 'game_end', 'chat')),
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz default now(),
  unique(room_id, seq)
);

-- Hands (private per player)
create table hands (
  room_id       text references rooms(id) on delete cascade,
  player_id     uuid references players(id),
  round         int  not null,
  tiles         int[] not null,
  primary key (room_id, player_id, round)
);

-- Indexes for fast lookups
create index moves_room_seq_idx on moves(room_id, seq);
create index players_room_idx on players(room_id);
create index hands_room_player_idx on hands(room_id, player_id);

-- Enable RLS on all tables
alter table rooms   enable row level security;
alter table players enable row level security;
alter table moves   enable row level security;
alter table hands   enable row level security;
