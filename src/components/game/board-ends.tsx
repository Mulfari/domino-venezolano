"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Tile } from "@/lib/game/types";

function PipGrid({ value }: { value: number }) {
  // pip positions: [top-left, top-right, mid-left, center, mid-right, bot-left, bot-right]
  const layouts: boolean[][] = [
    [],
    [false, false, false, true,  false, false, false],
    [true,  false, false, false, false, false, true ],
    [true,  false, false, true,  false, false, true ],
    [true,  true,  false, false, false, true,  true ],
    [true,  true,  false, true,  false, true,  true ],
    [true,  true,  true,  false, true,  true,  true ],
  ];
  const pips = layouts[value] ?? [];
  const positions = [
    { x: 5,  y: 5  }, // top-left
    { x: 15, y: 5  }, // top-right
    { x: 5,  y: 10 }, // mid-left
    { x: 10, y: 10 }, // center
    { x: 15, y: 10 }, // mid-right
    { x: 5,  y: 15 }, // bot-left
    { x: 15, y: 15 }, // bot-right
  ];

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      {pips.map((active, i) =>
        active ? (
          <circle key={i} cx={positions[i].x} cy={positions[i].y} r="2.2" fill="#1a1a1a" />
        ) : null
      )}
    </svg>
  );
}

function EndBadge({ value, label, matchCount, isCapicua }: { value: number; label: string; matchCount: number; isCapicua?: boolean }) {
  const hasMatches = matchCount > 0;
  return (
    <motion.div
      key={value}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 26 }}
      className="flex flex-col items-center gap-0.5"
      aria-label={`${label}: ${value}${hasMatches ? `, ${matchCount} ficha${matchCount !== 1 ? "s" : ""} tuya${matchCount !== 1 ? "s" : ""} encajan` : ""}${isCapicua ? ", capicúa" : ""}`}
    >
      <span className="text-[8px] uppercase tracking-widest text-[#a8c4a0]/50 leading-none font-semibold">
        {label}
      </span>
      <motion.div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        animate={isCapicua ? {
          boxShadow: [
            "0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 10px rgba(201,168,76,0.5)",
            "0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 22px rgba(201,168,76,0.9)",
            "0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 10px rgba(201,168,76,0.5)",
          ],
        } : {}}
        transition={isCapicua ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
        style={{
          background: isCapicua
            ? "linear-gradient(145deg, #fff8e8 0%, #f5e8c0 100%)"
            : "linear-gradient(145deg, #f5f0e8 0%, #e8e0d0 100%)",
          border: `1.5px solid ${isCapicua ? "rgba(201,168,76,0.95)" : hasMatches ? "rgba(201,168,76,0.75)" : "rgba(201,168,76,0.55)"}`,
          boxShadow: isCapicua
            ? "0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 14px rgba(201,168,76,0.6)"
            : hasMatches
            ? "0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 10px rgba(201,168,76,0.3)"
            : "0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <PipGrid value={value} />
      </motion.div>
      <span
        className="text-[10px] font-black tabular-nums leading-none"
        style={{ color: "#c9a84c", textShadow: "0 0 8px rgba(201,168,76,0.5)" }}
      >
        {value}
      </span>
      {/* Match count badge — how many of the player's tiles fit this end */}
      <AnimatePresence mode="wait">
        {hasMatches ? (
          <motion.span
            key={`match-${matchCount}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="text-[8px] font-bold tabular-nums leading-none px-1 py-0.5 rounded"
            style={{
              color: "#38dca0",
              background: "rgba(56,220,160,0.12)",
              border: "1px solid rgba(56,220,160,0.35)",
            }}
            aria-hidden="true"
          >
            {matchCount} tuya{matchCount !== 1 ? "s" : ""}
          </motion.span>
        ) : (
          <motion.span
            key="no-match"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[8px] leading-none px-1 py-0.5"
            style={{ color: "rgba(168,196,160,0.25)" }}
            aria-hidden="true"
          >
            —
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function countMatches(hand: Tile[], pipValue: number): number {
  return hand.filter((t) => t[0] === pipValue || t[1] === pipValue).length;
}

export function BoardEnds({ handCounts }: { handCounts?: number[] }) {
  const board = useGameStore((s) => s.board);
  const hands = useGameStore((s) => s.hands);
  const mySeat = useGameStore((s) => s.mySeat);
  const status = useGameStore((s) => s.status);
  const consecutivePasses = useGameStore((s) => s.consecutivePasses);

  if (board.left === null || board.right === null || board.plays.length === 0) return null;
  if (status !== "playing") return null;

  const myHand: Tile[] = mySeat !== null ? (hands[mySeat] ?? []) : [];
  const leftMatches = countMatches(myHand, board.left);
  const rightMatches = countMatches(myHand, board.right);
  const isCapicua = board.left === board.right && board.plays.length > 1;

  const totalRemaining = handCounts ? handCounts.reduce((a, b) => a + b, 0) : null;
  const tilesOnBoard = board.plays.length;
  const TOTAL_TILES = 28;
  const boardPct = Math.min((tilesOnBoard / TOTAL_TILES) * 100, 100);
  // Warn when few tiles remain — game is close to locking
  const isLowTiles = totalRemaining !== null && totalRemaining <= 8;
  const isHighBoard = tilesOnBoard >= 22; // board nearly full → lock risk

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center gap-1 pointer-events-none"
        role="status"
        aria-label={`Extremos del tablero: izquierda ${board.left}, derecha ${board.right}${isCapicua ? ", ¡capicúa!" : ""}. ${tilesOnBoard} de ${TOTAL_TILES} fichas en tablero${totalRemaining !== null ? `, ${totalRemaining} en mano` : ""}`}
      >
        {/* End badges row */}
        <div className="flex items-center gap-2">
          <EndBadge value={board.left} label="Izq" matchCount={leftMatches} isCapicua={isCapicua} />
          <div className="flex flex-col items-center gap-0.5">
            <AnimatePresence mode="wait">
              {isCapicua ? (
                <motion.div
                  key="capicua"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 500, damping: 24 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <motion.span
                    className="text-[8px] font-black uppercase tracking-widest leading-none whitespace-nowrap"
                    style={{ color: "#c9a84c", textShadow: "0 0 10px rgba(201,168,76,0.8)" }}
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  >
                    ¡Capicúa!
                  </motion.span>
                  <motion.div
                    className="h-px w-8 rounded-full"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.7), transparent)" }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="extremos"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span className="text-[7px] uppercase tracking-widest text-[#a8c4a0]/30 leading-none">
                    extremos
                  </span>
                  <div className="h-px w-4 bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <EndBadge value={board.right} label="Der" matchCount={rightMatches} isCapicua={isCapicua} />
        </div>

        {/* Consecutive passes tension meter */}
        {consecutivePasses > 0 && (
          <motion.div
            key={consecutivePasses}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="flex flex-col items-center gap-0.5"
            aria-label={`${consecutivePasses} pase${consecutivePasses !== 1 ? "s" : ""} consecutivo${consecutivePasses !== 1 ? "s" : ""} — el juego se tranca con 4`}
          >
            <span className="text-[7px] uppercase tracking-widest font-semibold leading-none"
              style={{ color: consecutivePasses >= 3 ? "#e84a3a" : "rgba(168,196,160,0.5)" }}>
              pases
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4].map((n) => {
                const filled = n <= consecutivePasses;
                const isFinal = n === 4;
                return (
                  <motion.div
                    key={n}
                    animate={filled && consecutivePasses >= 3 ? { opacity: [1, 0.5, 1] } : {}}
                    transition={filled && consecutivePasses >= 3 ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" } : {}}
                    className="w-3 h-3 rounded-sm"
                    style={{
                      background: filled
                        ? consecutivePasses >= 3
                          ? "linear-gradient(135deg, #e84a3a, #ff6b5a)"
                          : consecutivePasses >= 2
                          ? "linear-gradient(135deg, #fb923c, #fbbf24)"
                          : "rgba(168,196,160,0.55)"
                        : "rgba(0,0,0,0.3)",
                      border: `1px solid ${filled
                        ? consecutivePasses >= 3 ? "rgba(232,74,58,0.8)" : "rgba(251,146,60,0.6)"
                        : "rgba(168,196,160,0.15)"}`,
                      boxShadow: filled && consecutivePasses >= 3
                        ? "0 0 6px rgba(232,74,58,0.6)"
                        : undefined,
                    }}
                    aria-hidden="true"
                  />
                );
              })}
            </div>
            {consecutivePasses >= 3 && (
              <motion.span
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: [1, 0.6, 1], y: 0 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
                className="text-[7px] font-black uppercase tracking-widest leading-none whitespace-nowrap"
                style={{ color: "#e84a3a", textShadow: "0 0 6px rgba(232,74,58,0.7)" }}
              >
                ¡próximo tranca!
              </motion.span>
            )}
          </motion.div>
        )}

        {/* Board progress bar + counters */}
        <motion.div
          key={`board-progress-${tilesOnBoard}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 24 }}
          className="flex flex-col items-center gap-0.5 w-full px-1"
          aria-hidden="true"
        >
          {/* Progress bar */}
          <div
            className="w-20 h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={false}
              animate={{ width: `${boardPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                background: isHighBoard
                  ? "linear-gradient(90deg, #e84a3a, #ff6b5a)"
                  : "linear-gradient(90deg, #4a8c6a, #a8c4a0)",
              }}
            />
          </div>

          {/* Counters row */}
          <div className="flex items-center gap-2">
            {/* Board tiles */}
            <div
              className="flex items-center gap-1 rounded-full px-1.5 py-0.5"
              style={{
                background: isHighBoard ? "rgba(232,74,58,0.12)" : "rgba(0,0,0,0.22)",
                border: `1px solid ${isHighBoard ? "rgba(232,74,58,0.4)" : "rgba(168,196,160,0.15)"}`,
              }}
            >
              {/* Board icon */}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                <rect x="0.5" y="0.5" width="7" height="7" rx="1.5"
                  stroke={isHighBoard ? "#e84a3a" : "rgba(168,196,160,0.5)"} strokeWidth="0.8" fill="none"/>
                <line x1="4" y1="0.5" x2="4" y2="7.5"
                  stroke={isHighBoard ? "#e84a3a" : "rgba(168,196,160,0.4)"} strokeWidth="0.7"/>
              </svg>
              <motion.span
                className="text-[8px] font-bold tabular-nums leading-none"
                style={{ color: isHighBoard ? "#e84a3a" : "rgba(168,196,160,0.55)" }}
                animate={isHighBoard ? { opacity: [1, 0.55, 1] } : {}}
                transition={isHighBoard ? { duration: 0.85, repeat: Infinity, ease: "easeInOut" } : {}}
              >
                {tilesOnBoard}/{TOTAL_TILES}
              </motion.span>
            </div>

            {/* Hand tiles */}
            {totalRemaining !== null && (
              <div
                className="flex items-center gap-1 rounded-full px-1.5 py-0.5"
                style={{
                  background: isLowTiles ? "rgba(232,74,58,0.12)" : "rgba(0,0,0,0.22)",
                  border: `1px solid ${isLowTiles ? "rgba(232,74,58,0.4)" : "rgba(168,196,160,0.15)"}`,
                }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="7" height="7" rx="1.5"
                    stroke={isLowTiles ? "#e84a3a" : "rgba(168,196,160,0.5)"} strokeWidth="0.8" fill="none"/>
                  <circle cx="4" cy="4" r="1.2"
                    fill={isLowTiles ? "#e84a3a" : "rgba(168,196,160,0.5)"}/>
                </svg>
                <motion.span
                  className="text-[8px] font-bold tabular-nums leading-none"
                  style={{ color: isLowTiles ? "#e84a3a" : "rgba(168,196,160,0.55)" }}
                  animate={isLowTiles ? { opacity: [1, 0.55, 1] } : {}}
                  transition={isLowTiles ? { duration: 0.85, repeat: Infinity, ease: "easeInOut" } : {}}
                >
                  {totalRemaining} mano
                </motion.span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
