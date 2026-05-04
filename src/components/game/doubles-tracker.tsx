"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tile } from "@/lib/game/types";

function isDouble(tile: Tile): boolean {
  return tile[0] === tile[1];
}

function DoublePip({ value, played, isInMyHand, isBoardEnd }: {
  value: number;
  played: boolean;
  isInMyHand: boolean;
  isBoardEnd: boolean;
}) {
  const size = 20;
  const half = size / 2;
  const pipR = 2.2;

  const positions: Record<number, [number, number][]> = {
    0: [],
    1: [[half, half]],
    2: [[half * 0.4, half * 0.4], [half * 1.6, half * 1.6]],
    3: [[half * 0.4, half * 0.4], [half, half], [half * 1.6, half * 1.6]],
    4: [[half * 0.4, half * 0.4], [half * 1.6, half * 0.4], [half * 0.4, half * 1.6], [half * 1.6, half * 1.6]],
    5: [[half * 0.4, half * 0.4], [half * 1.6, half * 0.4], [half, half], [half * 0.4, half * 1.6], [half * 1.6, half * 1.6]],
    6: [[half * 0.4, half * 0.35], [half * 1.6, half * 0.35], [half * 0.4, half], [half * 1.6, half], [half * 0.4, half * 1.65], [half * 1.6, half * 1.65]],
  };

  const faceColor = played
    ? "rgba(26,26,26,0.6)"
    : isInMyHand
    ? "#fffbe8"
    : "#f5f0e8";

  const pipColor = played
    ? "rgba(80,80,80,0.5)"
    : isInMyHand
    ? "#c9a84c"
    : "#1a1a1a";

  const borderColor = played
    ? "rgba(255,255,255,0.06)"
    : isInMyHand
    ? "rgba(201,168,76,0.8)"
    : isBoardEnd
    ? "rgba(56,220,160,0.6)"
    : "rgba(201,168,76,0.35)";

  return (
    <motion.div
      className="relative"
      animate={played ? { opacity: 0.35 } : { opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="block"
      >
        <rect
          x={0.75}
          y={0.75}
          width={size - 1.5}
          height={size - 1.5}
          rx={3}
          fill={faceColor}
          stroke={borderColor}
          strokeWidth={1.2}
        />
        {(positions[value] ?? []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={pipR} fill={pipColor} />
        ))}
      </svg>
      {played && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5L5 9L9.5 3.5"
              stroke="rgba(74,222,128,0.85)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}

export function DoublesTracker() {
  const board = useGameStore((s) => s.board);
  const hands = useGameStore((s) => s.hands);
  const mySeat = useGameStore((s) => s.mySeat);
  const status = useGameStore((s) => s.status);
  const isMobile = useIsMobile();

  if (status !== "playing" || board.plays.length === 0) return null;

  const playedTiles = board.plays.map((p) => p.tile);
  const myHand: Tile[] = mySeat !== null ? (hands[mySeat] ?? []) : [];

  const playedDoubles = new Set<number>();
  for (const tile of playedTiles) {
    if (isDouble(tile)) playedDoubles.add(tile[0]);
  }

  const myDoubles = new Set<number>();
  for (const tile of myHand) {
    if (isDouble(tile)) myDoubles.add(tile[0]);
  }

  const playedCount = playedDoubles.size;
  const totalDoubles = 7;
  const remaining = totalDoubles - playedCount - myDoubles.size;

  return (
    <AnimatePresence>
      <motion.div
        key="doubles-tracker"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className="flex flex-col items-center gap-1 pointer-events-none"
        role="status"
        aria-label={`Dobles: ${playedCount} de ${totalDoubles} jugados, ${myDoubles.size} en tu mano, ${remaining} ocultos`}
      >
        <span
          className="text-[7px] sm:text-[8px] uppercase tracking-widest font-semibold leading-none"
          style={{ color: "rgba(168,196,160,0.45)" }}
        >
          dobles
        </span>

        <div
          className="flex items-center gap-0.5 sm:gap-1 rounded-lg px-1.5 sm:px-2 py-1 sm:py-1.5"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(201,168,76,0.15)",
          }}
        >
          {[0, 1, 2, 3, 4, 5, 6].map((val) => {
            const played = playedDoubles.has(val);
            const inMyHand = myDoubles.has(val);
            const isBoardEnd = board.left === val || board.right === val;

            return (
              <div
                key={val}
                className="flex flex-col items-center gap-0.5"
                title={
                  played
                    ? `Doble ${val}: jugado`
                    : inMyHand
                    ? `Doble ${val}: en tu mano`
                    : `Doble ${val}: oculto`
                }
              >
                <DoublePip
                  value={val}
                  played={played}
                  isInMyHand={inMyHand}
                  isBoardEnd={isBoardEnd}
                />
                {!isMobile && (
                  <span
                    className="text-[6px] font-bold tabular-nums leading-none"
                    style={{
                      color: played
                        ? "rgba(74,222,128,0.4)"
                        : inMyHand
                        ? "rgba(201,168,76,0.7)"
                        : "rgba(168,196,160,0.25)",
                    }}
                  >
                    {val}-{val}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-[7px] tabular-nums leading-none"
            style={{ color: "rgba(74,222,128,0.5)" }}
          >
            {playedCount} jugados
          </span>
          {myDoubles.size > 0 && (
            <span
              className="text-[7px] tabular-nums leading-none"
              style={{ color: "rgba(201,168,76,0.55)" }}
            >
              {myDoubles.size} tuyo{myDoubles.size !== 1 ? "s" : ""}
            </span>
          )}
          {remaining > 0 && (
            <span
              className="text-[7px] tabular-nums leading-none"
              style={{ color: "rgba(168,196,160,0.3)" }}
            >
              {remaining} oculto{remaining !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
