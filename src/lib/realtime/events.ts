import type { Tile, Seat, BoardState } from "@/lib/game/types";

/** Serialized game state sent over broadcast (no Map, plain arrays). */
export interface SerializedGameState {
  board: BoardState;
  hands: [number, number][][]; // indexed by seat
  current_turn: Seat;
  consecutive_passes: number;
  status: "dealing" | "playing" | "finished";
}

export type GameEvent =
  | { type: "tile_played"; seat: number; tile: [number, number]; end: "left" | "right" }
  | { type: "turn_passed"; seat: number }
  | { type: "round_started"; game_id: string; current_turn: number }
  | {
      type: "round_ended";
      winner_team: number | null;
      points: number;
      scores: { team0: number; team1: number };
      reason: "domino" | "locked" | "tied";
    }
  | { type: "game_state_sync"; state: SerializedGameState }
  | { type: "chat_message"; player_id: string; display_name: string; message: string }
  | { type: "player_connected"; seat: number; display_name: string }
  | { type: "player_disconnected"; seat: number }
  | { type: "emoji_reaction"; seat: number; emoji: string; id: string };

export interface PresenceState {
  user_id: string;
  display_name: string;
  seat: number;
  online_at: string;
}
