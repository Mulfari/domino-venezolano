"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function useMatchTimer() {
  const status = useGameStore((s) => s.status);
  const round = useGameStore((s) => s.round);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "playing" && startTimeRef.current === null) {
      startTimeRef.current = Date.now() - elapsed * 1000;
    }

    if (status === "playing") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, round, elapsed]);

  return { elapsed, formatted: formatDuration(elapsed) };
}

export { formatDuration };

interface MatchTimerProps {
  elapsed: number;
}

export function MatchTimer({ elapsed }: MatchTimerProps) {
  const status = useGameStore((s) => s.status);

  if (status !== "playing" || elapsed < 5) return null;

  const formatted = formatDuration(elapsed);
  const isLong = elapsed >= 600; // 10+ minutes
  const isMedium = elapsed >= 300; // 5+ minutes

  return (
    <AnimatePresence>
      <motion.div
        key="match-timer"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className="flex items-center gap-1 rounded-full px-2 py-0.5"
        style={{
          background: isLong
            ? "rgba(239,68,68,0.10)"
            : "rgba(0,0,0,0.25)",
          border: `1px solid ${
            isLong
              ? "rgba(239,68,68,0.35)"
              : isMedium
              ? "rgba(201,168,76,0.25)"
              : "rgba(245,240,232,0.08)"
          }`,
        }}
        role="timer"
        aria-label={`Tiempo de partida: ${formatted}`}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="5"
            cy="5"
            r="4"
            stroke={
              isLong
                ? "rgba(239,68,68,0.7)"
                : isMedium
                ? "rgba(201,168,76,0.5)"
                : "rgba(245,240,232,0.3)"
            }
            strokeWidth="1"
            fill="none"
          />
          <line
            x1="5"
            y1="5"
            x2="5"
            y2="2.5"
            stroke={
              isLong
                ? "rgba(239,68,68,0.8)"
                : isMedium
                ? "rgba(201,168,76,0.6)"
                : "rgba(245,240,232,0.4)"
            }
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <line
            x1="5"
            y1="5"
            x2="7"
            y2="6"
            stroke={
              isLong
                ? "rgba(239,68,68,0.8)"
                : isMedium
                ? "rgba(201,168,76,0.6)"
                : "rgba(245,240,232,0.4)"
            }
            strokeWidth="0.7"
            strokeLinecap="round"
          />
        </svg>
        <motion.span
          key={formatted}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="text-[9px] sm:text-[10px] font-bold tabular-nums leading-none"
          style={{
            color: isLong
              ? "rgba(239,68,68,0.85)"
              : isMedium
              ? "rgba(201,168,76,0.7)"
              : "rgba(245,240,232,0.45)",
          }}
        >
          {formatted}
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
}
