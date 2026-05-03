"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Seat } from "@/lib/game/types";
import type { MoveLogEntry } from "@/stores/game-store";

const TEAM_COLORS: Record<0 | 1, string> = {
  0: "#c9a84c",
  1: "#4ca8c9",
};

const MAX_VISIBLE = 4;

function MiniTile({ a, b }: { a: number; b: number }) {
  const W = 22;
  const H = 10;

  function pips(val: number, xOffset: number) {
    const cx = xOffset + 5;
    const positions: [number, number][] = [];
    if (val % 2 === 1) positions.push([cx, 5]);
    if (val >= 2) { positions.push([cx - 2, 3]); positions.push([cx + 2, 7]); }
    if (val >= 4) { positions.push([cx + 2, 3]); positions.push([cx - 2, 7]); }
    if (val === 6) { positions.push([cx - 2, 5]); positions.push([cx + 2, 5]); }
    return positions.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={0.75} fill="#1a1a1a" />
    ));
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="shrink-0">
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="1.5" fill="#f5f0e8" stroke="rgba(201,168,76,0.4)" strokeWidth="0.5" />
      <line x1={W / 2} y1="1" x2={W / 2} y2={H - 1} stroke="rgba(201,168,76,0.3)" strokeWidth="0.4" />
      {pips(a, 0)}
      {pips(b, W / 2)}
    </svg>
  );
}

function TimelineEntry({ entry, isMe, isLatest }: { entry: MoveLogEntry; isMe: boolean; isLatest: boolean }) {
  const team: 0 | 1 = (entry.seat % 2) as 0 | 1;
  const color = TEAM_COLORS[team];
  const name = isMe ? "Tú" : entry.playerName.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: 12, scale: 0.85 }}
      animate={{ opacity: isLatest ? 1 : 0.6, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -12, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className="flex items-center gap-1 shrink-0"
    >
      {/* Team dot */}
      <span
        className="w-1 h-1 rounded-full shrink-0"
        style={{ background: color, opacity: isLatest ? 1 : 0.6 }}
      />

      {/* Player name */}
      <span
        className="text-[8px] font-semibold leading-none truncate max-w-[40px]"
        style={{ color, opacity: isLatest ? 1 : 0.7 }}
      >
        {name}
      </span>

      {entry.type === "play" && entry.tile ? (
        <MiniTile a={entry.tile[0]} b={entry.tile[1]} />
      ) : (
        <span
          className="text-[8px] font-bold leading-none uppercase tracking-wider"
          style={{ color: "rgba(201,168,76,0.5)" }}
        >
          pasó
        </span>
      )}
    </motion.div>
  );
}

export function LastAction() {
  const moveLog = useGameStore((s) => s.moveLog);
  const status = useGameStore((s) => s.status);
  const mySeat = useGameStore((s) => s.mySeat);
  const round = useGameStore((s) => s.round);

  if (status !== "playing" || moveLog.length === 0) return null;

  const roundEntries = moveLog.filter((e) => e.round === round);
  if (roundEntries.length === 0) return null;

  const visible = roundEntries.slice(-MAX_VISIBLE);
  const lastEntry = visible[visible.length - 1];

  return (
    <div
      className="flex items-center gap-1 rounded-full px-2 py-0.5 pointer-events-none"
      style={{
        background: "rgba(0,0,0,0.35)",
        border: `1px solid rgba(201,168,76,0.12)`,
      }}
      role="status"
      aria-live="polite"
      aria-label={
        lastEntry.type === "play" && lastEntry.tile
          ? `Última jugada: ${lastEntry.playerName} jugó ${lastEntry.tile[0]}-${lastEntry.tile[1]}`
          : `Última jugada: ${lastEntry.playerName} pasó`
      }
    >
      {/* Separator dots between entries */}
      <AnimatePresence mode="popLayout">
        {visible.map((entry, i) => {
          const isMe = mySeat === entry.seat;
          const isLatest = i === visible.length - 1;
          return (
            <motion.div
              key={entry.id}
              className="flex items-center gap-1"
              layout
            >
              {i > 0 && (
                <span
                  className="text-[6px] leading-none select-none"
                  style={{ color: "rgba(168,196,160,0.25)" }}
                  aria-hidden="true"
                >
                  ›
                </span>
              )}
              <TimelineEntry entry={entry} isMe={isMe} isLatest={isLatest} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
