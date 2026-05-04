"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

const TEAM_COLORS = {
  0: { accent: "#c9a84c", glow: "rgba(201,168,76,0.5)" },
  1: { accent: "#4ca8c9", glow: "rgba(76,168,201,0.5)" },
} as const;

export function TrancadoDanger() {
  const consecutivePasses = useGameStore((s) => s.consecutivePasses);
  const status = useGameStore((s) => s.status);
  const mySeat = useGameStore((s) => s.mySeat);
  const hands = useGameStore((s) => s.hands);
  const board = useGameStore((s) => s.board);
  const scores = useGameStore((s) => s.scores);

  if (status !== "playing" || consecutivePasses < 2 || board.plays.length === 0) return null;

  const myTeam = mySeat !== null ? ((mySeat % 2) as 0 | 1) : null;
  const myHand = mySeat !== null ? (hands[mySeat] ?? []) : [];
  const myPips = myHand.reduce((s, [a, b]) => s + a + b, 0);

  // In a trancado, the team with fewer total pips wins those pips from the losing team
  // Show the player their pip count so they understand the stakes
  const isCritical = consecutivePasses >= 3;
  const passesUntilLock = 4 - consecutivePasses;

  // Determine if we're likely winning or losing a trancado based on known info
  // (only meaningful in bot games where all hands are visible)
  const allHandsKnown = [0, 1, 2, 3].every((s) => (hands[s as 0 | 1 | 2 | 3] ?? []).length > 0);
  let pipAdvantage: "winning" | "losing" | "tied" | null = null;
  if (allHandsKnown && myTeam !== null) {
    const team0Pips = (hands[0] ?? []).reduce((s, [a, b]) => s + a + b, 0)
                    + (hands[2] ?? []).reduce((s, [a, b]) => s + a + b, 0);
    const team1Pips = (hands[1] ?? []).reduce((s, [a, b]) => s + a + b, 0)
                    + (hands[3] ?? []).reduce((s, [a, b]) => s + a + b, 0);
    const myTeamPips = myTeam === 0 ? team0Pips : team1Pips;
    const theirTeamPips = myTeam === 0 ? team1Pips : team0Pips;
    pipAdvantage = myTeamPips < theirTeamPips ? "winning" : myTeamPips > theirTeamPips ? "losing" : "tied";
  }

  const borderColor = isCritical
    ? "rgba(239,68,68,0.7)"
    : "rgba(251,146,60,0.55)";
  const bgColor = isCritical
    ? "rgba(239,68,68,0.08)"
    : "rgba(251,146,60,0.06)";
  const textColor = isCritical ? "#ef4444" : "#fb923c";
  const glowColor = isCritical
    ? "rgba(239,68,68,0.4)"
    : "rgba(251,146,60,0.25)";

  return (
    <AnimatePresence>
      <motion.div
        key={`trancado-${consecutivePasses}`}
        initial={{ opacity: 0, scale: 0.85, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className="flex items-center gap-2 rounded-xl px-3 py-2 pointer-events-none"
        style={{
          background: bgColor,
          border: `1.5px solid ${borderColor}`,
          boxShadow: `0 0 ${isCritical ? "16px" : "10px"} ${glowColor}`,
        }}
        role="alert"
        aria-live="assertive"
        aria-label={`Peligro de trancado: ${consecutivePasses} pases consecutivos, ${passesUntilLock} más para trancar`}
      >
        {/* Lock icon */}
        <motion.div
          animate={isCritical ? { rotate: [-8, 8, -8], scale: [1, 1.1, 1] } : { rotate: [0, 5, -5, 0] }}
          transition={{
            duration: isCritical ? 0.5 : 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="3" y="8" width="12" height="8" rx="2" stroke={textColor} strokeWidth="1.5" fill="none" />
            <path
              d="M6 8V5.5C6 3.567 7.343 2 9 2s3 1.567 3 3.5V8"
              stroke={textColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="9" cy="12.5" r="1.2" fill={textColor} />
          </svg>
        </motion.div>

        {/* Content */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <motion.span
              className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest leading-none"
              style={{ color: textColor, textShadow: `0 0 8px ${glowColor}` }}
              animate={isCritical ? { opacity: [1, 0.5, 1] } : {}}
              transition={isCritical ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" } : {}}
            >
              {isCritical ? "¡Trancado inminente!" : "Peligro de trancado"}
            </motion.span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Pass counter pills */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: i <= consecutivePasses ? textColor : "rgba(255,255,255,0.1)",
                    border: `1px solid ${i <= consecutivePasses ? textColor : "rgba(255,255,255,0.15)"}`,
                  }}
                  animate={i === consecutivePasses ? { scale: [1, 1.3, 1] } : {}}
                  transition={i === consecutivePasses ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : {}}
                />
              ))}
            </div>

            <span
              className="text-[8px] sm:text-[9px] font-semibold tabular-nums leading-none"
              style={{ color: `${textColor}cc` }}
            >
              {consecutivePasses}/4 pases
            </span>

            {/* Pip count — your stake in a trancado */}
            {myHand.length > 0 && (
              <span
                className="text-[8px] sm:text-[9px] font-bold tabular-nums leading-none px-1.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${textColor}40`,
                  color: `${textColor}dd`,
                }}
              >
                tus pts: {myPips}
              </span>
            )}

            {/* Pip advantage indicator — only in bot games */}
            {pipAdvantage && pipAdvantage !== "tied" && (
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[8px] font-bold uppercase tracking-wider leading-none px-1.5 py-0.5 rounded-full"
                style={{
                  background: pipAdvantage === "winning" ? "rgba(74,222,128,0.12)" : "rgba(239,68,68,0.12)",
                  border: `1px solid ${pipAdvantage === "winning" ? "rgba(74,222,128,0.4)" : "rgba(239,68,68,0.4)"}`,
                  color: pipAdvantage === "winning" ? "#4ade80" : "#ef4444",
                }}
              >
                {pipAdvantage === "winning" ? "ventaja" : "desventaja"}
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
