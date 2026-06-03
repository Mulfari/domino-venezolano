export const TILE = {
  W: 80,
  H: 40,
  DOUBLE_W: 40,
  DOUBLE_H: 40,
  GAP: 4,
  HAND_SCALE: 0.8,
  MOBILE_SCALE: 0.6,
} as const;

export const COLORS = {
  felt: "#0B5345",
  wood: "#3E2723",
  gold: "#D4AF37",
  teamA: "#1E88E5",
  teamB: "#D4AF37",
  pip: "#1A1A1A",
  ivory: "#F5F0E1",
} as const;

export const GAME = {
  PLAYERS: 4,
  TILES_PER_PLAYER: 7,
  TARGET_SCORE: 100,
  TURN_TIMEOUT_MS: 30_000,
  HEARTBEAT_INTERVAL_MS: 10_000,
  RECONNECT_GRACE_MS: 30_000,
  AUTO_PLAY_GRACE_MS: 5 * 60_000,
  ROOM_TTL_HOURS: 24,
  PASSES_FOR_TRANCADO: 4,
} as const;

export const SEAT_TEAM: Record<number, 0 | 1> = {
  0: 0,
  1: 1,
  2: 0,
  3: 1,
};
