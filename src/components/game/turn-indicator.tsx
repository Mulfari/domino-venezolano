"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Team, Seat } from "@/lib/game/types";

const TEAM_COLORS: Record<
  Team,
  { bg: string; text: string; glow: string; subtle: string; border: string }
> = {
  0: {
    bg: "#c9a84c",
    text: "text-[#c9a84c]",
    glow: "#c9a84c",
    subtle: "rgba(201,168,76,0.15)",
    border: "rgba(201,168,76,0.45)",
  },
  1: {
    bg: "#4ca8c9",
    text: "text-[#4ca8c9]",
    glow: "#4ca8c9",
    subtle: "rgba(76,168,201,0.15)",
    border: "rgba(76,168,201,0.45)",
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

// Returns the table position of `seat` relative to `mySeat`:
// bottom = local player, top = partner, left/right = opponents
function getRelativePosition(mySeat: Seat, seat: Seat): "bottom" | "top" | "left" | "right" {
  const diff = ((seat - mySeat) + 4) % 4;
  if (diff === 0) return "bottom";
  if (diff === 1) return "right";
  if (diff === 2) return "top";
  return "left";
}

const POSITION_ARROW: Record<"bottom" | "top" | "left" | "right", string> = {
  bottom: "↓",
  top: "↑",
  left: "←",
  right: "→",
};

const POSITION_LABEL: Record<"bottom" | "top" | "left" | "right", string> = {
  bottom: "tú",
  top: "arriba",
  left: "izq",
  right: "der",
};

export function TurnIndicator() {
  const currentTurn = useGameStore((s) => s.currentTurn);
  const isMyTurnFn = useGameStore((s) => s.isMyTurn);
  const players = useGameStore((s) => s.players);
  const status = useGameStore((s) => s.status);
  const teamForSeat = useGameStore((s) => s.teamForSeat);
  const mySeat = useGameStore((s) => s.mySeat);

  const isMyTurn = isMyTurnFn();

  if (status !== "playing") return null;

  const currentPlayer = players.find((p) => p.seat === currentTurn);
  const displayName = currentPlayer?.displayName ?? `Jugador ${currentTurn + 1}`;
  const firstName = displayName.split(" ")[0];
  const team = teamForSeat(currentTurn);
  const colors = TEAM_COLORS[team];
  const isBot = currentPlayer?.isBot ?? false;

  const position = mySeat !== null ? getRelativePosition(mySeat, currentTurn) : null;
  const arrow = position ? POSITION_ARROW[position] : null;
  const posLabel = position ? POSITION_LABEL[position] : null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentTurn}
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="flex items-center gap-1.5 sm:gap-2 rounded-full px-2 sm:px-3 py-1 sm:py-1.5"
        role="status"
        aria-live="polite"
        aria-label={isMyTurn ? "Es tu turno" : `Turno de ${displayName}, Equipo ${team + 1}`}
        style={{
          backgroundColor: isMyTurn ? colors.subtle : "rgba(0,0,0,0.18)",
          border: `1px solid ${isMyTurn ? colors.border : "rgba(255,255,255,0.07)"}`,
          boxShadow: isMyTurn ? `0 0 14px ${colors.subtle}, 0 0 4px ${colors.subtle}` : "none",
          transition: "background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
        }}
      >
        {/* Directional arrow — mobile only, shows where the active player sits */}
        {!isMyTurn && arrow && (
          <AnimatePresence mode="wait">
            <motion.span
              key={`arrow-${currentTurn}`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              className="sm:hidden flex flex-col items-center leading-none shrink-0"
              aria-hidden="true"
            >
              <span
                className="text-[13px] font-black leading-none"
                style={{ color: colors.glow }}
              >
                {arrow}
              </span>
              <span
                className="text-[7px] uppercase tracking-widest leading-none font-semibold"
                style={{ color: `${colors.glow}99` }}
              >
                {posLabel}
              </span>
            </motion.span>
          </AnimatePresence>
        )}

        {/* Avatar — 24px on mobile, 32px on desktop */}
        <div className="relative flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center">
          {isMyTurn && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: colors.glow }}
              animate={{ scale: [1, 1.9], opacity: [0.35, 0] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: "easeOut" }}
            />
          )}

          <motion.div
            className="relative z-10 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[9px] sm:text-[11px] font-bold text-[#0f1e14] shadow"
            style={{ backgroundColor: colors.bg }}
            animate={
              isMyTurn
                ? {
                    boxShadow: [
                      `0 0 0px ${colors.glow}`,
                      `0 0 10px ${colors.glow}`,
                      `0 0 0px ${colors.glow}`,
                    ],
                  }
                : { boxShadow: "none" }
            }
            transition={
              isMyTurn
                ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
          >
            {initials(displayName)}
          </motion.div>

          {/* Team badge */}
          <div
            className="absolute -bottom-0.5 -right-0.5 z-20 flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded-full text-[6px] sm:text-[7px] font-black text-[#0f1e14]"
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
          {/* Desktop: full name. Mobile: first name (always visible now) */}
          <AnimatePresence mode="wait">
            <motion.span
              key={`name-${currentTurn}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.18 }}
              className={`text-[10px] sm:text-xs font-semibold truncate max-w-[60px] sm:max-w-none leading-none ${colors.text}`}
            >
              {/* On mobile show first name; on desktop show full name */}
              <span className="sm:hidden">{firstName}</span>
              <span className="hidden sm:inline">{displayName}</span>
            </motion.span>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {isMyTurn ? (
              <motion.span
                key="my-turn"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.18 }}
                className="text-[10px] font-semibold leading-none mt-0.5"
                style={{ color: colors.glow }}
              >
                ¡Tu turno!
              </motion.span>
            ) : isBot ? (
              <motion.span
                key="bot-thinking"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-0.5 leading-none mt-0.5"
              >
                <span className="text-[10px] text-[#a8c4a0]/55">pensando</span>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="inline-block w-0.5 h-0.5 rounded-full bg-[#a8c4a0]/55"
                    animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.18,
                    }}
                    aria-hidden="true"
                  />
                ))}
              </motion.span>
            ) : (
              <motion.span
                key="team-label"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.18 }}
                className="text-[10px] text-[#a8c4a0]/60 leading-none mt-0.5"
              >
                Equipo {team + 1}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
