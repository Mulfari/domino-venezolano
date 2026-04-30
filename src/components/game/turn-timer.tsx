"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

const TURN_DURATION = 30;

interface TurnTimerProps {
  onAutoPass?: () => void;
  onAutoPlay?: () => void;
}

export function TurnTimer({ onAutoPass, onAutoPlay }: TurnTimerProps) {
  const currentTurn = useGameStore((s) => s.currentTurn);
  const status = useGameStore((s) => s.status);
  const mySeat = useGameStore((s) => s.mySeat);
  const canPassFn = useGameStore((s) => s.canPass);
  const players = useGameStore((s) => s.players);
  const [seconds, setSeconds] = useState(TURN_DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPassedRef = useRef(false);

  const isMyTurn = mySeat !== null && currentTurn === mySeat;
  const canPass = canPassFn();
  const currentPlayer = players.find((p) => p.seat === currentTurn);
  const isBot = currentPlayer?.isBot ?? false;

  useEffect(() => {
    setSeconds(TURN_DURATION);
    autoPassedRef.current = false;
    if (status !== "playing") return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentTurn, status]);

  useEffect(() => {
    if (seconds === 0 && isMyTurn && !autoPassedRef.current) {
      autoPassedRef.current = true;
      if (canPass && onAutoPass) {
        onAutoPass();
      } else if (!canPass && onAutoPlay) {
        onAutoPlay();
      }
    }
  }, [seconds, isMyTurn, canPass, onAutoPass, onAutoPlay]);

  if (status !== "playing") return null;
  if (isBot) return null;

  const pct = seconds / TURN_DURATION;
  const urgent = seconds <= 10;

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* 32px on mobile, 40px on desktop */}
      <div className="relative w-8 h-8 sm:w-10 sm:h-10">
        <svg width="100%" height="100%" viewBox="0 0 40 40" className="-rotate-90">
          <circle
            cx={20} cy={20} r={radius}
            fill="none"
            stroke="#1e5c3a"
            strokeWidth={3}
          />
          <motion.circle
            cx={20} cy={20} r={radius}
            fill="none"
            stroke={urgent ? "#ef4444" : isMyTurn ? "#c9a84c" : "#a8c4a0"}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold tabular-nums ${
            urgent ? "text-red-400" : isMyTurn ? "text-[#c9a84c]" : "text-[#a8c4a0]/70"
          }`}
        >
          {seconds}
        </span>
      </div>
      {urgent && isMyTurn && (
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="hidden sm:inline text-xs text-red-400 font-semibold"
        >
          ¡Apúrate!
        </motion.span>
      )}
    </div>
  );
}
