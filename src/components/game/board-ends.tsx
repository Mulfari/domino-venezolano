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

function EndBadge({ value, label, matchCount }: { value: number; label: string; matchCount: number }) {
  const hasMatches = matchCount > 0;
  return (
    <motion.div
      key={value}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 26 }}
      className="flex flex-col items-center gap-0.5"
      aria-label={`${label}: ${value}${hasMatches ? `, ${matchCount} ficha${matchCount !== 1 ? "s" : ""} tuya${matchCount !== 1 ? "s" : ""} encajan` : ""}`}
    >
      <span className="text-[8px] uppercase tracking-widest text-[#a8c4a0]/50 leading-none font-semibold">
        {label}
      </span>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: "linear-gradient(145deg, #f5f0e8 0%, #e8e0d0 100%)",
          border: `1.5px solid ${hasMatches ? "rgba(201,168,76,0.75)" : "rgba(201,168,76,0.55)"}`,
          boxShadow: hasMatches
            ? "0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 10px rgba(201,168,76,0.3)"
            : "0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <PipGrid value={value} />
      </div>
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

export function BoardEnds() {
  const board = useGameStore((s) => s.board);
  const hands = useGameStore((s) => s.hands);
  const mySeat = useGameStore((s) => s.mySeat);
  const status = useGameStore((s) => s.status);

  if (board.left === null || board.right === null || board.plays.length === 0) return null;
  if (status !== "playing") return null;

  const myHand: Tile[] = mySeat !== null ? (hands[mySeat] ?? []) : [];
  const leftMatches = countMatches(myHand, board.left);
  const rightMatches = countMatches(myHand, board.right);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-2 pointer-events-none"
        role="status"
        aria-label={`Extremos del tablero: izquierda ${board.left}, derecha ${board.right}`}
      >
        <EndBadge value={board.left} label="Izq" matchCount={leftMatches} />
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] uppercase tracking-widest text-[#a8c4a0]/30 leading-none">
            extremos
          </span>
          <div className="h-px w-4 bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />
        </div>
        <EndBadge value={board.right} label="Der" matchCount={rightMatches} />
      </motion.div>
    </AnimatePresence>
  );
}
