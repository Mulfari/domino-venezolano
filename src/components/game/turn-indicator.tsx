"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Team } from "@/lib/game/types";

const TEAM_COLORS: Record<
  Team,
  { bg: string; text: string; glow: string; subtle: string; border: string }
> = {
  0: {
    bg: "#c9a84c",
    text: "text-[#c9a84c]",
    glow: "#c9a84c",
    subtle: "rgba(201,168,76,0.15)",
    border: "rgba(201,168,76,0.35)",
  },
  1: {
    bg: "#4ca8c9",
    text: "text-[#4ca8c9]",
    glow: "#4ca8c9",
    subtle: "rgba(76,168,201,0.15)",
    border: "rgba(76,168,201,0.35)",
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
        className="flex items-center gap-2 rounded-full px-3 py-1.5"
        style={{
          backgroundColor: isMyTurn ? colors.subtle : "rgba(0,0,0,0.18)",
          border: `1px solid ${isMyTurn ? colors.border : "rgba(255,255,255,0.07)"}`,
          transition: "background-color 0.4s ease, border-color 0.4s ease",
        }}
      >
        {/* Avatar with team badge */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          {/* Pulse rings — only on my turn */}
          {isMyTurn && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${colors.glow}` }}
                animate={{ scale: [1, 1.65], opacity: [0.65, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
              />
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
            </>
          )}

          {/* Avatar circle */}
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

          {/* Team number badge */}
          <div
            className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black text-[#0f1e14]"
            style={{
              backgroundColor: colors.bg,
              border: "1.5px solid #0f1e14",
              lineHeight: 1,
            }}
          >
            {team + 1}
          </div>
        </div>

        {/* Name + status */}
        <div className="flex flex-col leading-tight">
          <span className={`text-xs font-semibold ${colors.text}`}>
            {displayName}
          </span>
          <span className="text-[10px] text-[#a8c4a0]/60">
            {isMyTurn ? "¡Tu turno!" : `Equipo ${team + 1}`}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
