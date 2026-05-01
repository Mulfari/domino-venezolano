# Domino Venezolano

## Stack
- Next.js 16.2.4, React 19, TypeScript 5, Tailwind CSS 4
- Supabase (PostgreSQL + Auth + Realtime)
- Zustand for state, Framer Motion for animations
- Deployed on Vercel

## Project Structure
- src/app/(game)/juego/[code]/page.tsx - Main game page
- src/app/(lobby)/ - Lobby, rooms, profile pages
- src/components/game/ - Board, Hand, Tile, ScorePanel, etc.
- src/components/chat/ - Chat panel
- src/stores/game-store.ts - Zustand game state
- src/lib/game/ - Game logic (types, board-layout, scoring, bot)
- src/hooks/ - Custom hooks (use-chat, use-game-channel, use-presence)
- src/lib/supabase/ - Supabase client/admin/helpers

## Game Architecture
- 4 players, 2 teams (seats 0+2 vs 1+3)
- Venezuelan rules: first to 100 points wins
- Board renders as SVG with foreignObject tiles
- Tiles are SVG elements with circle pips
- Board layout uses snake/chain algorithm with turns at boundaries
- Real-time via Supabase channels

## Current Component Sizes
- Board: 420x420 desktop, 300x300 mobile (SVG viewBox)
- Tiles on board: small (20x36 desktop, 16x28 mobile)
- Tiles in hand: large (40x76 desktop, 32x58 mobile)
- Board tile dims: horizW=36, horizH=20, doubleW=20, doubleH=36, gap=3

## Game State (Zustand store)
- board: { left, right, plays: PlayedTile[] }
- hands: { 0: Tile[], 1: Tile[], 2: Tile[], 3: Tile[] }
- currentTurn, consecutivePasses, status
- mySeat, scores: { 0: number, 1: number }
- round, targetScore, players: PlayerInfo[]
- roundResult: { winner_team, points, reason }

## Visual Theme
- Casino felt green (#163d28) with dot pattern background
- Board: radial gradient greens (#1a5c35 -> #0f3520)
- Tiles: ivory face (#f5f0e8), dark pips (#1a1a1a)
- Gold accent (#c9a84c) for highlights, buttons, borders
- Dark wood panels (#3a2210/80) for UI elements
- Glass effects with backdrop blur

## CRITICAL RULES
1. ALWAYS run `npm run build` after changes to verify they compile
2. NEVER move files without updating ALL imports that reference them
3. NEVER commit if the build fails
4. Keep changes small and focused - one component per task
5. Test responsive: components must work on both mobile and desktop
6. Use existing Tailwind classes and CSS variables from globals.css
7. Maintain the casino/felt/wood visual theme
8. Use Framer Motion sparingly - only for meaningful interactions
9. All text in Spanish for the UI

## Current Top Bar Layout (page.tsx)
The game page has a simple top bar with:
- Left: ScorePanel (shows "Ronda N", "meta: 100", team scores)
- Center: TurnIndicator + TurnTimer
- Right: Room code badge + SoundToggle

## What Needs Improvement
- The scoreboard needs to show more info: who started the round, round history, team progress
- Board tiles need better visual quality and spacing
- The overall game experience needs polish
- Better visual feedback for actions (playing, passing, winning)
- The layout should feel more like a real domino table
