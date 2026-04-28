/** A domino tile represented as a tuple of two pip values (0-6). */
export type Tile = [number, number];

/** Seat index around the table (0-3, clockwise). */
export type Seat = 0 | 1 | 2 | 3;

/** Team index. Team 0 = seats 0+2, Team 1 = seats 1+3. */
export type Team = 0 | 1;

/** A tile that has been played on the board. */
export interface PlayedTile {
  tile: Tile;
  seat: Seat;
  end: "left" | "right";
}

/** Current state of the board (the chain of played tiles). */
export interface BoardState {
  left: number | null;
  right: number | null;
  plays: PlayedTile[];
}

/** High-level status of the game round. */
export type GameStatus = "dealing" | "playing" | "finished";

/** Result of a completed round. */
export interface RoundResult {
  winner_team: Team | null;
  points: number;
  reason: "domino" | "locked" | "tied";
}

/** Complete state of a single round. */
export interface GameState {
  board: BoardState;
  hands: Map<Seat, Tile[]>;
  current_turn: Seat;
  consecutive_passes: number;
  status: GameStatus;
}
