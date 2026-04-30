"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Team } from "@/lib/game/types";

const TEAM_COLORS: Record<
  Team,
  { bg: string; text: string; glow: string; subtle: string }
> = {
  0: {
    bg: "#c9a84c",
    text: "text-[#c9a84c]",
    glow: "#c9a84c",
    subtle: "rgba(201,168,76,0.12)",
  },
  1: {
    bg: "#4ca8c9",
    text: "text-[#4ca8c9]",
    glow: "#4ca8c9",
    subtle: "rgba(76,168,201,0.12)",
  },
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
        className="flex items-center gap-2 rounded-full px-2 py-1"
        style={{
          backgroundColor: isMyTurn ? colors.subtle : "transparent",
          transition: "background-color 0.4s ease",
        }}
      >
        {/* Avatar */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          {/* Outer pulse ring */}
          {isMyTurn && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${colors.glow}` }}
              animate={{ scale: [1, 1.65], opacity: [0.65, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          {/* Inner pulse ring — staggered */}
          {isMyTurn && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: `1.5px solid ${colors.glow}` }}
              animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.55,
              }}
            />
          )}
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-[#0f1e14] shadow"
            style={{ backgroundColor: colors.bg }}
            animate={
              isMyTurn
                ? {
                    boxShadow: [
                      `0 0 0px ${colors.glow}`,
                      `0 0 9px ${colors.glow}`,
                      `0 0 0px ${colors.glow}`,
                    ],
                  }
                : { boxShadow: "none" }
            }
            transition={
              isMyTurn
                ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                : {}
            }
          >
            {initials(displayName)}
          </motion.div>
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
