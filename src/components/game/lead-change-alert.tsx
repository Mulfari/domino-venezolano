"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Seat } from "@/lib/game/types";

const TEAM_COLORS = {
  0: { accent: "#c9a84c", glow: "rgba(201,168,76,0.7)", bg: "rgba(201,168,76,0.15)", border: "rgba(201,168,76,0.5)" },
  1: { accent: "#4ca8c9", glow: "rgba(76,168,201,0.7)", bg: "rgba(76,168,201,0.15)", border: "rgba(76,168,201,0.5)" },
} as const;

interface LeadChangeAlertProps {
  show: boolean;
  newLeader: 0 | 1;
  isMyTeam: boolean;
  scores: { 0: number; 1: number };
  players: { seat: Seat; displayName: string }[];
}

function teamName(team: 0 | 1, players: { seat: Seat; displayName: string }[]): string {
  const seats = team === 0 ? [0, 2] : [1, 3];
  const names = seats.map((s) => {
    const p = players.find((pl) => pl.seat === s);
    return p?.displayName.split(" ")[0] ?? `J${s + 1}`;
  });
  return names.join(" & ");
}

export function LeadChangeAlert({ show, newLeader, isMyTeam, scores, players }: LeadChangeAlertProps) {
  const colors = TEAM_COLORS[newLeader];
  const gap = Math.abs(scores[0] - scores[1]);
  const label = teamName(newLeader, players);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={`lead-change-${newLeader}-${scores[0]}-${scores[1]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeIn" } }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[52] flex items-center justify-center pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 100%)",
            backdropFilter: "blur(3px)",
          }}
          role="alert"
          aria-live="assertive"
          aria-label={isMyTeam ? "¡Tu equipo toma la delantera!" : "Los rivales toman la delantera"}
        >
          {/* Expanding rings */}
          <motion.div
            className="absolute rounded-full"
            initial={{ width: 50, height: 50, opacity: 0.7 }}
            animate={{ width: 420, height: 420, opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            style={{ border: `2px solid ${colors.accent}` }}
          />
          <motion.div
            className="absolute rounded-full"
            initial={{ width: 35, height: 35, opacity: 0.5 }}
            animate={{ width: 340, height: 340, opacity: 0 }}
            transition={{ duration: 0.85, ease: "easeOut", delay: 0.08 }}
            style={{ border: `1.5px solid ${colors.accent}` }}
          />

          {/* Horizontal streak */}
          <motion.div
            className="absolute h-[2px] pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
              top: "50%",
              left: 0,
              right: 0,
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 0.8, 0.3] }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          />

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.05, opacity: 0, y: -8, transition: { duration: 0.35 } }}
            transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.05 }}
            className="flex flex-col items-center gap-2.5 sm:gap-3"
          >
            {/* Arrow icon */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.08 }}
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                boxShadow: `0 0 30px ${colors.glow}`,
              }}
              aria-hidden="true"
            >
              <motion.svg
                width="28" height="28" viewBox="0 0 28 28" fill="none"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              >
                <path
                  d="M14 22V6M14 6L7 13M14 6L21 13"
                  stroke={colors.accent}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </motion.div>

            {/* Main text */}
            <motion.div
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.25 }}
            >
              <motion.span
                className="text-[28px] sm:text-[38px] font-black uppercase leading-none tracking-tight text-center"
                style={{
                  color: colors.accent,
                  textShadow: `0 0 40px ${colors.glow}, 0 0 20px ${colors.glow}, 0 4px 16px rgba(0,0,0,0.9)`,
                }}
                animate={{
                  textShadow: [
                    `0 0 40px ${colors.glow}, 0 0 20px ${colors.glow}, 0 4px 16px rgba(0,0,0,0.9)`,
                    `0 0 60px ${colors.glow}, 0 0 35px ${colors.glow}, 0 4px 16px rgba(0,0,0,0.9)`,
                    `0 0 40px ${colors.glow}, 0 0 20px ${colors.glow}, 0 4px 16px rgba(0,0,0,0.9)`,
                  ],
                }}
                transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
              >
                {isMyTeam ? "¡Remontada!" : "¡Cambio de líder!"}
              </motion.span>

              <motion.span
                className="text-[12px] sm:text-[14px] font-semibold uppercase tracking-[0.15em]"
                style={{
                  color: isMyTeam ? `${colors.accent}cc` : "rgba(245,240,232,0.6)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.2 }}
              >
                {isMyTeam ? "¡Tu equipo toma la delantera!" : `${label} toma la delantera`}
              </motion.span>
            </motion.div>

            {/* Score comparison */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.25 }}
              className="flex items-center gap-3 sm:gap-4"
            >
              {([0, 1] as const).map((team) => {
                const isLeader = team === newLeader;
                const tc = TEAM_COLORS[team];
                const isMe = (team === 0 ? [0, 2] : [1, 3]).some(
                  (s) => players.find((p) => p.seat === s)
                );
                return (
                  <motion.div
                    key={team}
                    animate={isLeader ? {
                      boxShadow: [
                        `0 0 0px ${tc.accent}00`,
                        `0 0 14px ${tc.accent}55`,
                        `0 0 0px ${tc.accent}00`,
                      ],
                    } : {}}
                    transition={isLeader ? { duration: 1.0, repeat: Infinity, ease: "easeInOut" } : {}}
                    className="flex flex-col items-center gap-1 rounded-xl px-3.5 py-2.5 min-w-[70px]"
                    style={{
                      background: isLeader ? tc.bg : "rgba(0,0,0,0.3)",
                      border: `1.5px solid ${isLeader ? tc.border : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <span
                      className="text-[8px] uppercase tracking-widest font-bold leading-none"
                      style={{ color: isLeader ? tc.accent : "rgba(245,240,232,0.45)" }}
                    >
                      {teamName(team, players).split(" ")[0]}
                    </span>
                    <motion.span
                      className="text-[24px] sm:text-[28px] font-black tabular-nums leading-none"
                      style={{
                        color: isLeader ? tc.accent : "rgba(245,240,232,0.55)",
                        textShadow: isLeader ? `0 0 12px ${tc.glow}` : undefined,
                      }}
                      initial={isLeader ? { scale: 0.7 } : {}}
                      animate={isLeader ? { scale: [0.7, 1.15, 1] } : {}}
                      transition={isLeader ? { delay: 0.4, duration: 0.5, ease: "easeOut" } : {}}
                    >
                      {scores[team]}
                    </motion.span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Gap badge */}
            {gap > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 22 }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1"
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <span
                  className="text-[11px] font-black tabular-nums leading-none"
                  style={{ color: colors.accent }}
                >
                  +{gap}
                </span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-widest leading-none"
                  style={{ color: `${colors.accent}99` }}
                >
                  {isMyTeam ? "ventaja" : "desventaja"}
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Radial glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none -z-10"
            style={{
              background: `radial-gradient(ellipse 50% 40% at 50% 50%, ${colors.bg} 0%, transparent 55%)`,
            }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
