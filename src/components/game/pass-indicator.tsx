"use client";

import { motion, AnimatePresence } from "framer-motion";

const TEAM_STYLES = {
  0: {
    border: "#c9a84c",
    text: "#c9a84c",
    bg: "#0d0600",
    ring: "rgba(201,168,76,0.5)",
    shadow: "0 0 28px 8px rgba(201,168,76,0.45), 0 0 10px 2px rgba(201,168,76,0.3), 0 8px 24px rgba(0,0,0,0.85)",
  },
  1: {
    border: "#4ca8c9",
    text: "#4ca8c9",
    bg: "#000810",
    ring: "rgba(76,168,201,0.5)",
    shadow: "0 0 28px 8px rgba(76,168,201,0.45), 0 0 10px 2px rgba(76,168,201,0.3), 0 8px 24px rgba(0,0,0,0.85)",
  },
} as const;

interface PassIndicatorProps {
  show: boolean;
  playerName?: string;
  teamIndex?: 0 | 1;
}

export function PassIndicator({ show, playerName, teamIndex = 0 }: PassIndicatorProps) {
  const style = TEAM_STYLES[teamIndex];

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {show ? (playerName ? `${playerName} pasó su turno` : "Turno pasado") : ""}
      </div>
      <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: 0.9,
            y: -28,
            transition: { duration: 0.45, ease: "easeIn" },
          }}
          transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex flex-col items-center gap-1.5"
        >
          {/* Expanding ripple rings */}
          <motion.div
            className="absolute rounded-full"
            style={{ border: `2px solid ${style.ring}` }}
            initial={{ width: 40, height: 40, opacity: 0.8, x: "-50%", y: "-50%" }}
            animate={{ width: 140, height: 140, opacity: 0, x: "-50%", y: "-50%" }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{ border: `1.5px solid ${style.ring}` }}
            initial={{ width: 30, height: 30, opacity: 0.6, x: "-50%", y: "-50%" }}
            animate={{ width: 110, height: 110, opacity: 0, x: "-50%", y: "-50%" }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.06 }}
          />

          <motion.div
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center gap-2 rounded-full px-4 py-2.5 backdrop-blur-sm whitespace-nowrap"
            style={{
              background: `${style.bg}/97`,
              border: `2px solid ${style.border}`,
              boxShadow: style.shadow,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="7.5" stroke={style.border} strokeWidth="1.5" />
              <line x1="5.5" y1="5.5" x2="12.5" y2="12.5" stroke={style.border} strokeWidth="2" strokeLinecap="round" />
              <line x1="12.5" y1="5.5" x2="5.5" y2="12.5" stroke={style.border} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span
              className="text-[13px] sm:text-[15px] font-bold uppercase tracking-widest leading-none"
              style={{ color: style.text }}
            >
              Paso
            </span>
          </motion.div>
          {playerName && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.2 }}
              className="text-[11px] sm:text-[12px] text-[#f5f0e8]/85 font-semibold truncate max-w-[110px] text-center"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}
            >
              {playerName}
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
