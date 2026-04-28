import type { Seat, Team } from "./types";

/** Number of tiles dealt to each player. */
export const TILES_PER_PLAYER = 7;

/** Total tiles in a standard double-six set. */
export const TOTAL_TILES = 28;

/** Highest pip value on any tile. */
export const MAX_PIP = 6;

/** All four seats in play order. */
export const SEATS: readonly Seat[] = [0, 1, 2, 3] as const;

/** Which seats belong to each team. */
export const TEAM_SEATS: Record<Team, readonly [Seat, Seat]> = {
  0: [0, 2],
  1: [1, 3],
};

/** Points needed to win the match. */
export const DEFAULT_TARGET_SCORE = 100;
