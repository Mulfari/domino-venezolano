# Domino Venezolano v2 — Design Spec

**Date:** 2026-06-03
**Status:** Approved (brainstorming complete, awaiting plan)
**Author:** Brainstorming session with user

## Context

A web application for 4 family members to play Venezuelan domino online, accessible from PC and mobile. This is a fresh build after deleting the previous version of the project. The goal is a fast, simple, and visually polished experience that replaces the prior codebase entirely.

**Validated constraints (from brainstorming):**
- 4 players, 2 teams (partners sit across from each other)
- Invite link access, no accounts, no login
- 100 points to win (fixed, not configurable)
- Casino visual theme: green felt board, wood tiles, gold accents
- Supabase (Postgres + Realtime) for backend
- Vercel for frontend hosting
- No bot players — rooms wait for 4 humans to start

## Goals

- Build a complete, playable Venezuelan domino game from zero
- Reuse the visual identity of the previous project (casino theme)
- Apply lessons from the prior codebase: avoid over-engineering, write tests for the tile orientation logic from day 1
- Deliver a fast, mobile-friendly experience
- Persist game state in Supabase so any player can reload and continue

## Non-Goals

- Public matchmaking or skill-based pairing (invite link only)
- User accounts, profiles, or authentication
- Spectator mode or replay analysis
- Bot players (the room requires 4 humans)
- Configurable target score (fixed at 100)
- Multiple language support (Spanish only for now)

## Architecture

### Stack

- **Frontend:** Next.js 15+ (App Router), React, TypeScript, Tailwind, Framer Motion, Zustand
- **Backend:** Supabase (Postgres, Realtime channels, Row-Level Security)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **No edge functions** — game logic runs in the client; Supabase is the source of truth via RLS

### Trust model

The game is **client-authoritative**: each client computes local state from the append-only `moves` log and proposes new moves by inserting into `moves`. Supabase RLS prevents cheating by:

- Allowing only the active player to insert `play_tile` or `pass` moves (verified by trigger against current turn)
- Allowing players to read only their own hand (via `hands` table with RLS on `player_id`)
- Allowing anyone with the room id to read `moves` and `players` (so all clients can sync)

Because the game is family-only and has no monetary stakes, the trust model does not need cryptographic verification. If a client misbehaves, the others can desync and reload from the `moves` log to recover.

## Data Model

```sql
-- A game room. Identified by a short random slug in the URL.
create table rooms (
  id            text primary key,
  status        text not null,         -- 'waiting' | 'playing' | 'finished'
  target_score  int  not null default 100,
  created_at    timestamptz default now(),
  host_player_id uuid
);

-- A player seated in a room. No account, identity is localStorage + uuid.
create table players (
  id            uuid primary key default gen_random_uuid(),
  room_id       text references rooms(id) on delete cascade,
  seat          int  not null,         -- 0..3
  name          text not null,
  team          int  not null,         -- 0 or 1 (seats 0+2 vs 1+3)
  joined_at     timestamptz default now(),
  last_seen     timestamptz default now(),
  connected     boolean default true,
  unique(room_id, seat)
);

-- Append-only log of every game event. Source of truth.
create table moves (
  id            bigserial primary key,
  room_id       text references rooms(id) on delete cascade,
  player_id     uuid references players(id),
  seq           int  not null,         -- per-room sequence number
  type          text not null,         -- 'deal' | 'play_tile' | 'pass' | 'round_end' | 'game_end' | 'chat'
  payload       jsonb not null,
  created_at    timestamptz default now(),
  unique(room_id, seq)
);

-- Private hand per player per round. RLS hides other players' hands.
create table hands (
  room_id       text references rooms(id) on delete cascade,
  player_id     uuid references players(id),
  round         int  not null,
  tiles         int[] not null,        -- tile ids 0..27 (see encoding)
  primary key (room_id, player_id, round)
);
```

### Tile encoding

The 28 domino tiles are encoded as integers 0..27 using the formula `id = a * 7 + b` where `a <= b`:
- 0-0 → 0, 0-1 → 1, ..., 0-6 → 6
- 1-1 → 7, 1-2 → 8, ...
- 6-6 → 27

A hand is then a simple `int[]`.

### Row-Level Security

```sql
-- Anyone can read room/player/move state if they know the room id.
create policy "rooms_read"   on rooms   for select using (true);
create policy "players_read" on players for select using (true);
create policy "moves_read"   on moves   for select using (true);

-- Each player can read only their own hand. The client sets
-- 'app.current_player_id' on connect so RLS can compare.
create policy "hands_read_own" on hands for select
  using (player_id = (current_setting('app.current_player_id', true))::uuid);

-- A trigger on moves validates that:
-- - the player_id matches the active player for the room
-- - for 'play_tile' moves, the tile is actually in the player's hand
-- and rejects the insert otherwise.
```

### Realtime

- One channel per room: `room:{id}`
- The channel broadcasts `moves` and `chat` inserts as they happen
- Postgres changes are also subscribed to filtered by `room_id` for `moves` and `players`

## Game Flow

### Room lifecycle

```
created (waiting) ──host starts──► playing ──team reaches 100──► finished
                                       │
                                       ├── round_end (modal) ──continue──► playing (next round)
                                       └── (loops until game_end)
```

### Per-room steps

1. **Create:** host clicks "Crear sala" on landing. Client generates `room_id` (slug like `k7m2-x9pq`), inserts a `rooms` row, creates a `players` row with `seat=0`, redirects to `/juego/k7m2-x9pq`.
2. **Invite:** host shares the URL via WhatsApp.
3. **Join:** each guest opens the URL, is prompted for a name, the client inserts a `players` row with the next available `seat`. Full rooms show a "sala llena" screen.
4. **Wait:** all clients see a 4-seat grid with names appearing as players join. Empty seats show "esperando...".
5. **Deal:** once 4 players are seated, the host (seat 0) sees a "Repartir" button. Their client:
   - Generates a deterministic shuffle (seeded from `room_id`)
   - Inserts 4 rows into `hands` (one per player, each with 7 tiles)
   - Inserts one `moves` row with `type='deal'` and `payload={starter_seat, tiles_distribution}` so other clients can verify
6. **Play:** the player with the doble-6 (or highest sum tile if no doble-6) plays first. Each turn:
   - Active player sees their hand; playable tiles glow gold, unplayable are 50% opacity
   - Click on a playable tile → end-selector appears (izq/der) → click on the board end → tile is placed
   - If no tile can be played, "Pasar" button appears
   - 30s without action → auto-passes (or auto-plays the first valid tile)
7. **Round end:**
   - **Por dominó:** active player has no tiles. Their team gets the sum of opponents' remaining tiles.
   - **Por trancado:** 4 consecutive passes. Team with fewer points in hand loses; difference is added to the winning team.
   - Round-end modal shows summary. Auto-continues in 10s or on "Continuar" click.
8. **New round:** hands are re-dealt, starter rotates clockwise.
9. **Game end:** team reaches 100 points. Game-over modal with final standings. "Nueva partida" resets the score, "Salir" returns to landing.

### Per-move sequence

Every action in the game becomes a row in `moves` with a monotonically increasing `seq`. Clients:

1. Optimistically update local state
2. INSERT the move via Supabase
3. Receive broadcast, reconcile if needed

If two clients race, the row with the higher `seq` is the canonical one. Clients always apply moves in `seq` order. If a move arrives out of order, the client queues it. If a move is rejected (RLS), the client rolls back the optimistic update and shows a toast.

## Components

```
src/
├── app/
│   ├── page.tsx                       # Landing: "Crear sala"
│   └── juego/[code]/
│       └── page.tsx                   # Game route
├── components/
│   ├── lobby/
│   │   ├── create-room-button.tsx
│   │   └── join-by-name.tsx
│   ├── waiting-room/
│   │   ├── seat-grid.tsx
│   │   └── share-link.tsx
│   ├── game/
│   │   ├── board.tsx
│   │   ├── hand.tsx
│   │   ├── opponent-hand.tsx
│   │   ├── tile.tsx
│   │   ├── end-selector.tsx
│   │   ├── score-panel.tsx
│   │   ├── turn-indicator.tsx
│   │   ├── round-end-modal.tsx
│   │   ├── game-over-modal.tsx
│   │   └── chat-panel.tsx
│   └── ui/                            # primitives
├── lib/
│   ├── game/
│   │   ├── board-layout.ts
│   │   ├── deal.ts
│   │   ├── rules.ts
│   │   ├── scoring.ts
│   │   └── state.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── store/
│       ├── room-store.ts
│       └── player-store.ts
└── hooks/
    ├── use-room.ts
    ├── use-hand.ts
    └── use-presence.ts
```

## Visual Design

### Board layout algorithm

The board is rendered as a chain starting from a center point and growing outward in a snake pattern:

- Position 0 is at the center, rendered vertically
- Even positions extend to the right
- Odd positions extend to the left
- Horizontal and vertical tiles alternate to avoid overlap

### Tile orientation

This was the highest-priority bug in the previous project. The rule:

- When a tile is played on the **right end** of the chain, its `tile[1]` (side "b") connects to the board. Render as-is.
- When a tile is played on the **left end**, swap `tile[0]` and `tile[1]` before rendering so the connecting number is on the side touching the board.

The `buildPlacedTiles(moves)` function must handle this explicitly, with unit tests covering every orientation.

### Tile rendering

- Horizontal tile: 80×40 px
- Vertical tile: 40×80 px
- Double tile: 40×40 px with center divider
- Gap between tiles: 4 px
- Hand scale: 0.8x
- Mobile scale: 0.6x

Material: ivory gradient with subtle wood grain, 2px gold border (`#D4AF37`), drop-shadow, bevel. Pips are dark circles with radial gradient for depth.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Oponente (top)         ←    nombre    [●]             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                       │
│                                                          │
│  Oponente (left)   ┌───────────────────────┐   Oponente (right)│
│  ▓▓▓▓▓▓            │                       │   ▓▓▓▓▓▓        │
│  ▓▓▓▓▓▓            │   TABLERO (snake)     │   ▓▓▓▓▓▓        │
│  nombre            │                       │   nombre        │
│                    └───────────────────────┘                 │
│                                                          │
│  Score:  Equipo 1  55  ▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱  100       │
│          Equipo 2  30  ▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱  100       │
│                                                          │
│  Tu mano: [6-3] [5-5] [4-2] [4-1] [3-0] [2-1] [1-0]    │
└─────────────────────────────────────────────────────────┘
```

### Color tokens

```ts
export const COLORS = {
  felt:    '#0B5345',  // casino green
  wood:    '#3E2723',  // dark wood
  gold:    '#D4AF37',  // gold
  teamA:   '#1E88E5',  // blue
  teamB:   '#D4AF37',  // gold
  pip:     '#1A1A1A',
  ivory:   '#F5F0E1',
}
```

### Animations

- **Tile placed:** `scale(0.5 → 1)` with spring bounce
- **Hand hover:** `translateY(-8px)` over 200ms
- **Your turn:** subtle pulse on the hand area
- **Disconnected:** fade to 50% opacity

## Player Identity (no accounts)

- On first join to a room, the client generates `player_id = uuid()` and stores it in `localStorage` under `domino:player:{room_id}`
- On reload, the client reads the stored `player_id` and RLS recognizes the player → recovers the hand
- Clearing localStorage = new identity = new seat (loses current game)

## Reconnection and Presence

- Each client sends a heartbeat every 10s, updating `players.last_seen`
- A computed view (or trigger) sets `connected = (now - last_seen < 30s)`
- UI: disconnected players show their seat grayed out with "Esperando reconexión..."
- Reconnection: client reloads, reads `player_id` from localStorage, joins the room, RLS recognizes them, hand is re-fetched
- Players absent for more than 5 minutes: their turn is auto-passed, but they can rejoin and continue playing in subsequent turns

## Edge Cases

| Case | Behavior |
|---|---|
| Doble-6 in hand at start | That player starts. If no one has it, highest sum tile starts. |
| Trancado | 4 consecutive passes → round ends, team with fewer hand points loses, difference added to winner. |
| Capicúa | Both board ends match. Number is worth double for scoring. Golden badge displayed. |
| Player has only a double, not matching board end | Double can be played on any side (Venezuelan rule). |
| Last tile (Dominó) | Round ends. Active player's team scores the sum of opponents' remaining tiles. |
| Empty room > 24h | Auto-deleted by a Supabase scheduled function. |
| Player loses connection mid-game | `connected=false` after 30s, hand shown grayed out. |
| Disconnected on turn | Auto-passes at 30s. If they return, they resume next turn. |
| Player reconnects (reloads URL) | localStorage restores identity, RLS re-recognizes them, hand refetched. |
| Player opens URL in second tab | Modal: "Ya estás conectado en otra pestaña. ¿Continuar aquí?" If yes, other tab marked disconnected. |
| Host leaves before starting | Any other player can take host role. |
| Host leaves during game | Game continues; any player can start a new game after game over. |
| Two players move simultaneously | `seq` resolves ordering; clients apply in `seq` order. |
| Out-of-order Realtime delivery | Client sorts by `seq` and queues missing moves. |
| Desync | Client calls `resync()` which reloads the full `moves` log and rebuilds state. Shows spinner for 1-2s. |
| RLS rejects a move | Client rolls back optimistic update, shows toast "Jugada inválida". |
| Two tabs of the same player | Modal in the second tab asks to continue there, marks the first tab as disconnected. |

## Errors and UX

| Error | UX |
|---|---|
| No internet | Yellow banner: "Sin conexión. Reintentando..." Actions queued and retried. |
| Supabase down | Red banner: "Servicio no disponible. Reintentar" with manual retry button. |
| Invalid move (RLS rejects) | Red toast: "Jugada inválida". State reverts. |
| Room full | "Esta sala ya tiene 4 jugadores" with option to create a new one. |
| Room not found | "Esta sala no existe o ya terminó" with option to create a new one. |
| Move takes >5s | Spinner on the tile. Toast "Conexión lenta, reintentando" if it persists. |

## Testing Strategy

### Unit tests (Vitest)

Target: **30+ tests** before the first playable game.

- `rules.ts` — every game rule: who can play, who starts, trancado, capicúa, double-out rules
- `scoring.ts` — point calculation for dominó, trancado, capicúa
- `board-layout.ts` — positioning **and orientation** (the bug from the previous project)
- `deal.ts` — deterministic shuffle with the same seed produces the same hand
- `state.ts` — deriving current state from a `moves` log

### Integration tests (local Supabase)

Run against `supabase start` (local stack):
- Create room, join 4 players, play one complete round, verify the `moves` log
- RLS: player A cannot read player B's hand
- RLS: player A cannot insert a move when not their turn
- RLS: player A cannot insert a `play_tile` move with a tile not in their hand

### E2E tests (Playwright)

- 2 browser contexts (host + guest) open the same URL
- Both clients show the same board state after a play
- Full hand played, both contexts reflect it
- Reconnect: close one browser, reopen, hand is restored

### Visual checklist (manual)

- Board with 0, 1, 5, 14, 28 tiles — all render correctly
- Mobile viewport: board fits, hand is touchable, opponents visible
- Opponents left/right of active player — their hands are in the correct positions
- Doble-6 first move — rotated 90°, aligned to center

## Performance

- Maximum 28 tiles on the board — no performance concern
- One Realtime channel per room, filtered by `room_id`
- React.memo on `tile.tsx` and `opponent-hand.tsx`; Zustand with selectors
- Maximum 2 simultaneous animations (Framer Motion `layoutId` for the moving tile)
- Tree-shaking aggressive, Framer Motion only in client components

## Deployment

- **Vercel:** auto-deploy from GitHub, custom domain (e.g., `domino.com.ve` previously held)
- **Supabase:** new project, migrations in `supabase/migrations/`
- **Environment variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **No service_role key** in the client

## Definition of Done

A user can:

1. Open the landing page, click "Crear sala"
2. Share the URL with 3 family members
3. Each family member opens the URL on PC or phone, enters a name
4. Host clicks "Repartir" once all 4 are seated
5. Players take turns playing tiles, passing, watching the board update in real time
6. A round ends (dominó or trancado), scores update, next round starts
7. The game ends when a team reaches 100
8. Any player can reload their browser at any time and resume the game
