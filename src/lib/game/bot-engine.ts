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
  board: BoardState
): { tile: Tile; end: "left" | "right" } | null {
  const moves = getValidMoves(hand, board);
  if (moves.length === 0) return null;

  // Prefer doubles first (get rid of them early)
  const doubleMoves = moves.filter((m) => m.tile[0] === m.tile[1]);
  if (doubleMoves.length > 0) {
    return doubleMoves.reduce((best, m) =>
      m.tile[0] + m.tile[1] > best.tile[0] + best.tile[1] ? m : best
    );
  }

  // Then play highest-value tile
  return moves.reduce((best, m) =>
    m.tile[0] + m.tile[1] > best.tile[0] + best.tile[1] ? m : best
  );
}
