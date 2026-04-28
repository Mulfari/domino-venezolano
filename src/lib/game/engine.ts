import type { Tile, Seat, BoardState, GameState } from "./types";

/**
 * Checks whether a tile can connect to the given pip value on the specified end.
 * Returns true if either side of the tile matches the value.
 */
export function tilesMatch(
  tile: Tile,
  value: number,
  _end: "left" | "right"
): boolean {
  return tile[0] === value || tile[1] === value;
}

/**
 * Returns all valid moves for a hand given the current board state.
 * On an empty board, any tile can be played (though the first move is always [6,6]).
 */
export function getValidMoves(
  hand: Tile[],
  board: BoardState
): { tile: Tile; end: "left" | "right" }[] {
  const moves: { tile: Tile; end: "left" | "right" }[] = [];

  // Empty board — any tile can be played on either end (they're equivalent)
  if (board.left === null || board.right === null) {
    for (const tile of hand) {
      moves.push({ tile, end: "left" });
    }
    return moves;
  }

  for (const tile of hand) {
    if (tilesMatch(tile, board.left, "left")) {
      moves.push({ tile, end: "left" });
    }
    // Avoid duplicate moves when both ends share the same value
    if (board.left !== board.right && tilesMatch(tile, board.right, "right")) {
      moves.push({ tile, end: "right" });
    }
    // When ends match, a tile that fits still only needs one entry per end,
    // but if the tile fits and both ends are equal we already added it above.
    // However if the ends ARE equal, we should still allow "right" for tiles
    // that match — but it's functionally identical to "left", so one entry suffices.
  }

  return moves;
}

/**
 * Advances to the next seat (clockwise).
 */
export function nextTurn(current: Seat): Seat {
  return ((current + 1) % 4) as Seat;
}

/**
 * Applies a tile play to the game state, returning a new immutable GameState.
 * Throws if the move is invalid.
 */
export function applyMove(
  state: GameState,
  seat: Seat,
  tile: Tile,
  end: "left" | "right"
): GameState {
  if (state.status !== "playing") {
    throw new Error("Cannot play: round is not in progress.");
  }
  if (state.current_turn !== seat) {
    throw new Error(`Not seat ${seat}'s turn (current: ${state.current_turn}).`);
  }

  const hand = state.hands.get(seat);
  if (!hand) {
    throw new Error(`No hand found for seat ${seat}.`);
  }

  const tileIndex = hand.findIndex(
    ([a, b]) => (a === tile[0] && b === tile[1]) || (a === tile[1] && b === tile[0])
  );
  if (tileIndex === -1) {
    throw new Error("Tile not found in player's hand.");
  }

  const board = state.board;

  // Validate the move against the board
  if (board.left !== null && board.right !== null) {
    const targetValue = end === "left" ? board.left : board.right;
    if (!tilesMatch(tile, targetValue, end)) {
      throw new Error(
        `Tile [${tile}] cannot be played on the ${end} end (value ${targetValue}).`
      );
    }
  }

  // Determine new board endpoints
  let newLeft: number;
  let newRight: number;

  if (board.left === null || board.right === null) {
    // First tile on the board
    newLeft = tile[0];
    newRight = tile[1];
  } else if (end === "left") {
    // Connect to the left end — the matching pip attaches, the other becomes the new left
    newLeft = tile[0] === board.left ? tile[1] : tile[0];
    newRight = board.right;
  } else {
    // Connect to the right end
    newLeft = board.left;
    newRight = tile[1] === board.right ? tile[0] : tile[1];
  }

  // Build new hand (remove the played tile)
  const newHand = [...hand.slice(0, tileIndex), ...hand.slice(tileIndex + 1)];

  // Build new hands map
  const newHands = new Map(state.hands);
  newHands.set(seat, newHand);

  const newBoard: BoardState = {
    left: newLeft,
    right: newRight,
    plays: [...board.plays, { tile, seat, end }],
  };

  const finished = newHand.length === 0;

  return {
    board: newBoard,
    hands: newHands,
    current_turn: finished ? seat : nextTurn(seat),
    consecutive_passes: 0,
    status: finished ? "finished" : "playing",
  };
}

/**
 * Applies a pass for the given seat, returning a new GameState.
 * If 4 consecutive passes occur the round is finished (locked).
 */
export function applyPass(state: GameState, seat: Seat): GameState {
  if (state.status !== "playing") {
    throw new Error("Cannot pass: round is not in progress.");
  }
  if (state.current_turn !== seat) {
    throw new Error(`Not seat ${seat}'s turn (current: ${state.current_turn}).`);
  }

  const newPasses = state.consecutive_passes + 1;
  const locked = newPasses >= 4;

  return {
    board: state.board,
    hands: new Map(state.hands),
    current_turn: locked ? seat : nextTurn(seat),
    consecutive_passes: newPasses,
    status: locked ? "finished" : "playing",
  };
}

/**
 * Returns true if the round is over (someone emptied their hand or the board is locked).
 */
export function isRoundOver(state: GameState): boolean {
  return state.status === "finished";
}
