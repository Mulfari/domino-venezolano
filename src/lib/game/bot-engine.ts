import type { Tile, BoardState } from "./types";
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

export function chooseBotMove(
  hand: Tile[],
  board: BoardState,
  mustPlayDouble6 = false
): { tile: Tile; end: "left" | "right" } | null {
  const moves = getValidMoves(hand, board, mustPlayDouble6);
  if (moves.length === 0) return null;

  // Score each move based on strategy
  const scored = moves.map((move) => {
    let score = 0;
    const [a, b] = move.tile;
    const isDouble = a === b;

    // Prefer doubles early (they're harder to play later since they only match one value)
    if (isDouble) score += 15;

    // Prefer high-value tiles (get rid of points)
    score += (a + b) * 2;

    // Prefer tiles that keep options open: count how many remaining tiles
    // in hand share a pip value with this tile's "outward" face
    const outwardPip = getOutwardPip(move.tile, move.end, board);
    if (outwardPip !== null) {
      const remaining = hand.filter(
        (t) => !(t[0] === a && t[1] === b) && (t[0] === outwardPip || t[1] === outwardPip)
      );
      score += remaining.length * 3;
    }

    // Prefer playing tiles that use pips we have many of (control the board)
    const pipCounts = countPips(hand);
    score += (pipCounts[a] ?? 0) + (pipCounts[b] ?? 0);

    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}

function getOutwardPip(tile: Tile, end: "left" | "right", board: BoardState): number | null {
  if (board.left === null || board.right === null) return tile[1];
  const target = end === "left" ? board.left : board.right;
  return tile[0] === target ? tile[1] : tile[0];
}

function countPips(hand: Tile[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const [a, b] of hand) {
    counts[a] = (counts[a] ?? 0) + 1;
    counts[b] = (counts[b] ?? 0) + 1;
  }
  return counts;
}
