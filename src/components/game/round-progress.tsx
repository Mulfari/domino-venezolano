"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import { useIsMobile } from "@/hooks/use-mobile";

export function RoundProgress() {
  const board = useGameStore((s) => s.board);
  const status = useGameStore((s) => s.status);
  const isMobile = useIsMobile();

  if (status !== "playing" || board.plays.length === 0) return null;

  const played = board.plays.length;
  const total = 28;
  const pct = (played / total) * 100;
  const isLate = played >= 20;
  const isMid = played >= 12 && played < 20;

  const size = isMobile ? 32 : 38;
  const strokeWidth = isMobile ? 2.5 : 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  const ringColor = isLate
    ? "rgba(239,68,68,0.85)"
    : isMid
    ? "rgba(251,146,60,0.75)"
    : "rgba(201,168,76,0.65)";

  const textColor = isLate
    ? "#ef4444"
    : isMid
    ? "#fb923c"
    : "#c9a84c";

  const trackColor = "rgba(0,0,0,0.35)";

  return (
    <AnimatePresence>
      <motion.div
        key="round-progress"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className="flex flex-col items-center gap-0.5 pointer-events-none"
        role="status"
        aria-label={`${played} de ${total} fichas jugadas`}
      >
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
            aria-hidden="true"
          >
            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={trackColor}
              strokeWidth={strokeWidth}
            />
            {/* Progress */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={false}
              animate={{
                strokeDashoffset: dashOffset,
                opacity: isLate ? [1, 0.6, 1] : 1,
              }}
              transition={isLate ? {
                strokeDashoffset: { duration: 0.5, ease: "easeOut" },
                opacity: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
              } : {
                strokeDashoffset: { duration: 0.5, ease: "easeOut" },
              }}
              style={{
                filter: isLate
                  ? "drop-shadow(0 0 4px rgba(239,68,68,0.6))"
                  : isMid
                  ? "drop-shadow(0 0 3px rgba(251,146,60,0.4))"
                  : "drop-shadow(0 0 2px rgba(201,168,76,0.3))",
              }}
            />
          </svg>
          {/* Center count */}
          <div
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.span
              key={played}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="font-black tabular-nums leading-none"
              style={{
                fontSize: isMobile ? 10 : 12,
                color: textColor,
              }}
            >
              {played}
            </motion.span>
          </div>
        </div>
        <span
          className="text-center leading-none uppercase tracking-widest font-semibold"
          style={{
            fontSize: isMobile ? 6 : 7,
            color: "rgba(168,196,160,0.4)",
          }}
        >
          /{total}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
