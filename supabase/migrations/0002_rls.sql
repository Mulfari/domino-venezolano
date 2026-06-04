-- Anyone with knowledge of the room id can read rooms/players/moves
create policy "rooms_read"   on rooms   for select using (true);
create policy "players_read" on players for select using (true);
create policy "moves_read"   on moves   for select using (true);

-- Insert a room: anyone can create one (no auth)
create policy "rooms_insert" on rooms for insert with check (true);

-- Insert/update player: anyone can join or update their own row by id
create policy "players_insert" on players for insert with check (true);
create policy "players_update_own" on players for update
  using (id = (current_setting('app.current_player_id', true))::uuid);

-- Insert moves: anyone can insert; the trigger validates game logic
create policy "moves_insert" on moves for insert with check (true);

-- Hands: read only your own hand
create policy "hands_read_own" on hands for select
  using (player_id = (current_setting('app.current_player_id', true))::uuid);
create policy "hands_insert" on hands for insert with check (true);
