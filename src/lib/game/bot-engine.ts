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

export function chooseBotMove(
  hand: Tile[],
  board: BoardState,
  mustPlayDouble6 = false,
  botSeat?: Seat
): { tile: Tile; end: "left" | "right" } | null {
  const moves = getValidMoves(hand, board, mustPlayDouble6);
  if (moves.length === 0) return null;

  const partnerSeat = botSeat !== undefined ? ((botSeat + 2) % 4) as Seat : undefined;
  const partnerPips = partnerSeat !== undefined ? getPlayedPips(board.plays, partnerSeat) : new Set<number>();
  const opponentPassedPips = botSeat !== undefined ? getPassedPips(board, botSeat) : new Set<number>();

  const scored = moves.map((move) => {
    let score = 0;
    const [a, b] = move.tile;
    const isDouble = a === b;

    if (isDouble) score += 15;

    score += (a + b) * 2;

    const outwardPip = getOutwardPip(move.tile, move.end, board);
    if (outwardPip !== null) {
      const remaining = hand.filter(
        (t) => !(t[0] === a && t[1] === b) && (t[0] === outwardPip || t[1] === outwardPip)
      );
      score += remaining.length * 3;

      if (partnerPips.has(outwardPip)) score += 8;
      if (opponentPassedPips.has(outwardPip)) score += 6;
    }

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

function getPassedPips(board: BoardState, botSeat: Seat): Set<number> {
  const passed = new Set<number>();
  const plays = board.plays;
  if (plays.length < 2) return passed;

  let runningLeft = plays[0].tile[0];
  let runningRight = plays[0].tile[1];

  const opponents = new Set<Seat>([((botSeat + 1) % 4) as Seat, ((botSeat + 3) % 4) as Seat]);

  for (let i = 1; i < plays.length; i++) {
    const play = plays[i];
    const prevPlay = plays[i - 1];

    if (opponents.has(prevPlay.seat)) {
      const skippedSeats = getSkippedSeats(plays, i);
      for (const skipped of skippedSeats) {
        if (opponents.has(skipped)) {
          passed.add(play.end === "left" ? runningLeft : runningRight);
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
