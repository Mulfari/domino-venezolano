import type { Tile, Seat, BoardState, PlayedTile } from "./types";
import { getValidMoves } from "./engine";

const BOT_NAMES = ["Bot Carlos", "Bot María", "Bot Pedro", "Bot Ana", "Bot Luis", "Bot Rosa"];

export function getRandomBotName(): string {
  return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
}

export const BOT_USER_PREFIX = "bot_";

export function isBotUserId(userId: string): boolean {
  return userId.startsWith(BOT_USER_PREFIX);
}

export function generateBotUserId(): string {
  return `${BOT_USER_PREFIX}${crypto.randomUUID()}`;
}

/* ------------------------------------------------------------------ */
/*  Strategic analysis helpers                                        */
/* ------------------------------------------------------------------ */

function countPips(hand: Tile[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const [a, b] of hand) {
    counts[a] = (counts[a] ?? 0) + 1;
    counts[b] = (counts[b] ?? 0) + 1;
  }
  return counts;
}

function getPlayedPips(plays: PlayedTile[], seat: Seat): Set<number> {
  const pips = new Set<number>();
  for (const play of plays) {
    if (play.seat === seat) {
      pips.add(play.tile[0]);
      pips.add(play.tile[1]);
    }
  }
  return pips;
}

/** Infer which pips opponents have passed on by analyzing the board state at each pass. */
function getOpponentPassedPips(board: BoardState, botSeat: Seat): Map<Seat, Set<number>> {
  const passed = new Map<Seat, Set<number>>();
  const opponents: Seat[] = [((botSeat + 1) % 4) as Seat, ((botSeat + 3) % 4) as Seat];
  for (const opp of opponents) passed.set(opp, new Set());

  const plays = board.plays;
  if (plays.length < 2) return passed;

  let runningLeft = plays[0].tile[0];
  let runningRight = plays[0].tile[1];

  for (let i = 1; i < plays.length; i++) {
    const play = plays[i];
    const skippedSeats = getSkippedSeats(plays, i);

    for (const skipped of skippedSeats) {
      if (opponents.includes(skipped)) {
        const boardLeftAtSkip = runningLeft;
        const boardRightAtSkip = runningRight;
        passed.get(skipped)!.add(boardLeftAtSkip);
        if (boardLeftAtSkip !== boardRightAtSkip) {
          passed.get(skipped)!.add(boardRightAtSkip);
        }
      }
    }

    if (play.end === "right") {
      runningRight = play.tile[0] === runningRight ? play.tile[1] : play.tile[0];
    } else {
      runningLeft = play.tile[1] === runningLeft ? play.tile[0] : play.tile[1];
    }
  }

  return passed;
}

function getSkippedSeats(plays: PlayedTile[], currentIndex: number): Seat[] {
  if (currentIndex === 0) return [];
  const prevSeat = plays[currentIndex - 1].seat;
  const currSeat = plays[currentIndex].seat;
  const skipped: Seat[] = [];
  let s = ((prevSeat + 1) % 4) as Seat;
  while (s !== currSeat) {
    skipped.push(s);
    s = ((s + 1) % 4) as Seat;
  }
  return skipped;
}

/** What pip value would face outward after playing this tile on this end? */
function getOutwardPip(tile: Tile, end: "left" | "right", board: BoardState): number | null {
  if (board.left === null || board.right === null) return tile[1];
  const target = end === "left" ? board.left : board.right;
  return tile[0] === target ? tile[1] : tile[0];
}

/** Simulate what the board ends would be after playing a move. */
function simulateEnds(
  tile: Tile, end: "left" | "right", board: BoardState
): { left: number; right: number } {
  if (board.left === null || board.right === null) {
    return { left: tile[0], right: tile[1] };
  }
  if (end === "left") {
    const newLeft = tile[0] === board.left ? tile[1] : tile[0];
    return { left: newLeft, right: board.right };
  }
  const newRight = tile[1] === board.right ? tile[0] : tile[1];
  return { left: board.left, right: newRight };
}

/** Count how many tiles in hand connect to a given pip. */
function handConnectionsTo(hand: Tile[], pip: number, excludeTile?: Tile): number {
  return hand.filter(
    (t) =>
      !(excludeTile && t[0] === excludeTile[0] && t[1] === excludeTile[1]) &&
      (t[0] === pip || t[1] === pip)
  ).length;
}

/* ------------------------------------------------------------------ */
/*  Main bot decision function                                        */
/* ------------------------------------------------------------------ */

export function chooseBotMove(
  hand: Tile[],
  board: BoardState,
  mustPlayDouble6 = false,
  botSeat?: Seat,
  handCounts?: number[]
): { tile: Tile; end: "left" | "right" } | null {
  const moves = getValidMoves(hand, board, mustPlayDouble6);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  const partnerSeat = botSeat !== undefined ? ((botSeat + 2) % 4) as Seat : undefined;
  const partnerPips = partnerSeat !== undefined ? getPlayedPips(board.plays, partnerSeat) : new Set<number>();
  const oppPassedMap = botSeat !== undefined ? getOpponentPassedPips(board, botSeat) : new Map<Seat, Set<number>>();
  const allOppPassed = new Set<number>();
  for (const pips of oppPassedMap.values()) {
    for (const p of pips) allOppPassed.add(p);
  }

  const myPipCounts = countPips(hand);
  const totalPipsInHand = hand.reduce((s, [a, b]) => s + a + b, 0);

  const opponentSeats: Seat[] = botSeat !== undefined
    ? [((botSeat + 1) % 4) as Seat, ((botSeat + 3) % 4) as Seat]
    : [];

  const opponentPips = new Set<number>();
  for (const opp of opponentSeats) {
    for (const p of getPlayedPips(board.plays, opp)) opponentPips.add(p);
  }

  // Detect if trancado is likely (consecutive passes building up)
  const trancadoRisk = handCounts
    ? handCounts.filter((c) => c <= 2).length >= 2 && board.plays.length > 16
    : board.plays.length > 20;

  // Detect if an opponent is about to dominate (1-2 tiles left)
  const opponentAboutToDominate = handCounts
    ? opponentSeats.some((s) => (handCounts[s] ?? 7) <= 2)
    : false;

  const scored = moves.map((move) => {
    let score = 0;
    const [a, b] = move.tile;
    const isDouble = a === b;
    const outwardPip = getOutwardPip(move.tile, move.end, board);
    const simEnds = simulateEnds(move.tile, move.end, board);

    // --- 1. Doubles priority: play them early since they're harder to place ---
    if (isDouble) {
      score += 12;
      // Higher doubles are more urgent to shed
      score += a * 1.5;
    }

    // --- 2. Pip shedding: prefer playing high-pip tiles to reduce trancado risk ---
    score += (a + b) * 1.2;

    // --- 3. Cuadre: lock both ends to the same pip (Venezuelan key strategy) ---
    if (simEnds.left === simEnds.right) {
      const cuadrePip = simEnds.left;
      const myStrength = myPipCounts[cuadrePip] ?? 0;
      // Strong cuadre: we have more tiles of this pip
      if (myStrength >= 2) {
        score += 20 + myStrength * 4;
      } else if (myStrength >= 1) {
        score += 12;
      }
      // Even better if opponents have passed on this pip
      if (allOppPassed.has(cuadrePip)) {
        score += 15;
      }
      // Bonus if partner has played this pip (they likely have more)
      if (partnerPips.has(cuadrePip)) {
        score += 8;
      }
      // Penalty if we're locking to a pip we don't control
      if (myStrength === 0 && !partnerPips.has(cuadrePip)) {
        score -= 10;
      }
    }

    // --- 4. Keep board open to our strong suits ---
    if (outwardPip !== null) {
      const remaining = handConnectionsTo(hand, outwardPip, move.tile);
      score += remaining * 4;

      // Bonus: leaving an end our partner can play on
      if (partnerPips.has(outwardPip)) score += 7;

      // Bonus: leaving an end opponents have passed on (they can't play)
      if (allOppPassed.has(outwardPip)) score += 8;

      // Penalty: leaving an end opponents are strong in
      if (opponentPips.has(outwardPip) && !allOppPassed.has(outwardPip)) {
        score -= 4;
      }
    }

    // --- 5. Avoid leaving ends we can't follow up on ---
    if (outwardPip !== null) {
      const futureConnections = handConnectionsTo(hand, outwardPip, move.tile);
      if (futureConnections === 0 && !partnerPips.has(outwardPip)) {
        score -= 6;
      }
    }

    // --- 6. Suit dominance: play from our strongest suit ---
    const suitStrength = (myPipCounts[a] ?? 0) + (myPipCounts[b] ?? 0);
    score += suitStrength * 1.5;

    // --- 7. Opponent blocking: if opponent is about to dominate, try to block ---
    if (opponentAboutToDominate && outwardPip !== null) {
      // Prefer leaving pips opponents have passed on
      for (const [oppSeat, oppPassed] of oppPassedMap) {
        if ((handCounts?.[oppSeat] ?? 7) <= 2 && oppPassed.has(outwardPip)) {
          score += 12;
        }
      }
    }

    // --- 8. Trancado awareness: minimize pip count when lock is likely ---
    if (trancadoRisk) {
      score += (a + b) * 2;
    }

    // --- 9. Capicúa defense: avoid leaving both ends equal if opponent benefits ---
    if (simEnds.left === simEnds.right && board.plays.length > 2) {
      const capPip = simEnds.left;
      // If opponents likely have this pip and we don't control it, risky
      if (opponentPips.has(capPip) && (myPipCounts[capPip] ?? 0) === 0) {
        score -= 8;
      }
    }

    // --- 10. Early game: prefer playing from diverse suits to keep options open ---
    if (board.plays.length < 6) {
      const uniquePipsAfter = new Set<number>();
      for (const t of hand) {
        if (t[0] === a && t[1] === b) continue;
        uniquePipsAfter.add(t[0]);
        uniquePipsAfter.add(t[1]);
      }
      score += uniquePipsAfter.size * 0.5;
    }

    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}
