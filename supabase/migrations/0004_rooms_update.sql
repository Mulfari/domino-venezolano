-- Allow anyone with knowledge of the room id to update it.
-- Threat model matches the rest of the project: family-only, no auth,
-- the room id IS the capability. The deal action needs to flip status
-- from waiting → playing when the host clicks Repartir.
create policy "rooms_update" on rooms for update
  using (true) with check (true);
