"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Seat } from "@/lib/game/types";

const TEAM_COLORS: Record<0 | 1, string> = {
  0: "#c9a84c",
  1: "#4ca8c9",
};

function MiniTile({ a, b }: { a: number; b: number }) {
  const W = 26;
  const H = 12;

  function pips(val: number, xOffset: number) {
    const cx = xOffset + 6;
    const positions: [number, number][] = [];
    if (val % 2 === 1) positions.push([cx, 6]);
    if (val >= 2) { positions.push([cx - 2.5, 3.5]); positions.push([cx + 2.5, 8.5]); }
    if (val >= 4) { positions.push([cx + 2.5, 3.5]); positions.push([cx - 2.5, 8.5]); }
    if (val === 6) { positions.push([cx - 2.5, 6]); positions.push([cx + 2.5, 6]); }
    return positions.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={0.9} fill="#1a1a1a" />
    ));
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="shrink-0">
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="1.5" fill="#f5f0e8" stroke="rgba(201,168,76,0.45)" strokeWidth="0.6" />
      <line x1={W / 2} y1="1" x2={W / 2} y2={H - 1} stroke="rgba(201,168,76,0.35)" strokeWidth="0.5" />
      {pips(a, 0)}
      {pips(b, W / 2)}
    </svg>
  );
}

export function LastAction() {
  const moveLog = useGameStore((s) => s.moveLog);
  const status = useGameStore((s) => s.status);
  const mySeat = useGameStore((s) => s.mySeat);

  if (status !== "playing" || moveLog.length === 0) return null;

  const last = moveLog[moveLog.length - 1];
  const team: 0 | 1 = (last.seat % 2) as 0 | 1;
  const color = TEAM_COLORS[team];
  const isMe = mySeat === last.seat;
  const name = isMe ? "Tú" : last.playerName;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={last.id}
        initial={{ opacity: 0, y: 4, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className="flex items-center gap-1.5 rounded-full px-2 py-0.5 pointer-events-none"
        style={{
          background: "rgba(0,0,0,0.35)",
          border: `1px solid ${color}22`,
        }}
        role="status"
        aria-live="polite"
        aria-label={
          last.type === "play" && last.tile
            ? `${name} jugó ${last.tile[0]}-${last.tile[1]} por la ${last.end === "left" ? "izquierda" : "derecha"}`
            : `${name} pasó`
        }
      >
        {/* Team dot */}
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: color }}
        />

        {/* Player name */}
        <span
          className="text-[9px] font-semibold leading-none truncate max-w-[60px]"
          style={{ color }}
        >
          {name}
        </span>

        {last.type === "play" && last.tile ? (
          <>
            <MiniTile a={last.tile[0]} b={last.tile[1]} />
            <span
              className="text-[8px] leading-none uppercase tracking-wider"
              style={{ color: "rgba(168,196,160,0.5)" }}
            >
              {last.end === "left" ? "izq" : "der"}
            </span>
          </>
        ) : (
          <span
            className="text-[9px] font-bold leading-none uppercase tracking-wider"
            style={{ color: "rgba(201,168,76,0.6)" }}
          >
            pasó
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
