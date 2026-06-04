import { decodeTile } from "./tiles";
import { isTrancado } from "./rules";
import { GAME } from "./constants";

export type Phase = "waiting" | "playing" | "round_end" | "finished";
export type RoundEndReason = "domino" | "trancado";

export interface MoveRow {
  seq: number;
  type: string;
  playerId?: string;
  payload: Record<string, unknown>;
}

export interface GameState {
  phase: Phase;
  activeSeat: number;
  boardEnds: { left: number; right: number };
  roundEndReason?: RoundEndReason;
  placedTiles: Array<{
    tile: number;
    end: "left" | "right" | "center";
    seq: number;
  }>;
}

interface DeriveInput {
  status: "waiting" | "playing" | "finished";
  moves: MoveRow[];
  players: { id: string; seat: number }[];
}

/**
 * Derives the current game state from the moves log and the player
 * roster. This is the single source of truth on the client. The full
 * state can be reconstructed at any time by replaying the log.
 */
export function deriveGameState(input: DeriveInput): GameState {
  if (input.status === "waiting" || input.moves.length === 0) {
    return {
      phase: input.status === "waiting" ? "waiting" : "playing",
      activeSeat: -1,
      boardEnds: { left: -1, right: -1 },
      placedTiles: [],
    };
  }

  // Index players by id for O(1) lookups
  const playerById = new Map(input.players.map((p) => [p.id, p.seat]));

  // Find the deal move to get the starter seat
  const dealMove = input.moves.find((m) => m.type === "deal");
  const starterSeat = (dealMove?.payload?.starterSeat as number) ?? 0;

  // Walk forward and track placed tiles, board ends, and last play_tile seq
  const placed: GameState["placedTiles"] = [];
  let leftEnd = -1;
  let rightEnd = -1;
  let lastAuthorSeat: number | null = null;

  for (const m of input.moves) {
    if (m.type !== "play_tile") continue;
    const tile = m.payload.tile as number;
    const end = (m.payload.end as "left" | "right" | "center") ?? "right";
    placed.push({ tile, end, seq: m.seq });
    const [a, b] = decodeTile(tile);
    if (placed.length === 1) {
      leftEnd = a;
      rightEnd = b;
    } else if (end === "right") {
      const newRight = a === rightEnd ? b : a;
      rightEnd = newRight;
    } else if (end === "left") {
      const newLeft = a === leftEnd ? b : a;
      leftEnd = newLeft;
    }
    if (m.playerId) {
      const seat = playerById.get(m.playerId);
      if (seat !== undefined) lastAuthorSeat = seat;
    }
  }

  // Determine if the round has ended
  if (isTrancado(input.moves.map((m) => ({ type: m.type })))) {
    return {
      phase: "round_end",
      activeSeat: -1,
      boardEnds: { left: leftEnd, right: rightEnd },
      roundEndReason: "trancado",
      placedTiles: placed,
    };
  }

  // Active seat is the player after the last move's author
  let activeSeat: number;
  if (lastAuthorSeat === null) {
    activeSeat = starterSeat;
  } else {
    activeSeat = (lastAuthorSeat + 1) % GAME.PLAYERS;
  }

  return {
    phase: input.status === "finished" ? "finished" : "playing",
    activeSeat,
    boardEnds: { left: leftEnd, right: rightEnd },
    placedTiles: placed,
  };
}
