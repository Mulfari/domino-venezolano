"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Team } from "@/lib/game/types";

const TEAM_COLORS: Record<Team, { bg: string; text: string; glow: string }> = {
  0: { bg: "#c9a84c", text: "text-[#c9a84c]", glow: "#c9a84c" },
  1: { bg: "#4ca8c9", text: "text-[#4ca8c9]", glow: "#4ca8c9" },
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TurnIndicator() {
  const currentTurn = useGameStore((s) => s.currentTurn);
  const isMyTurnFn = useGameStore((s) => s.isMyTurn);
  const players = useGameStore((s) => s.players);
  const status = useGameStore((s) => s.status);
  const teamForSeat = useGameStore((s) => s.teamForSeat);

  const isMyTurn = isMyTurnFn();

  if (status !== "playing") return null;

  const currentPlayer = players.find((p) => p.seat === currentTurn);
  const displayName = currentPlayer?.displayName ?? `Jugador ${currentTurn + 1}`;
  const team = teamForSeat(currentTurn);
  const colors = TEAM_COLORS[team];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentTurn}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-2"
      >
        {/* Avatar */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          {/* Pulse ring — only when it's my turn */}
          {isMyTurn && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${colors.glow}` }}
              animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-[#0f1e14] shadow"
            style={{ backgroundColor: colors.bg }}
          >
            {initials(displayName)}
          </div>
        </div>

        {/* Label */}
        <div className="flex flex-col leading-tight">
          <span className={`text-xs font-semibold ${colors.text}`}>
            {isMyTurn ? "¡Tu turno!" : displayName}
          </span>
          <span className="text-[10px] text-[#a8c4a0]/60">
            {isMyTurn ? displayName : `Equipo ${team + 1}`}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
