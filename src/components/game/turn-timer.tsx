"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

const TURN_DURATION = 60;

export function TurnTimer() {
  const currentTurn = useGameStore((s) => s.currentTurn);
  const status = useGameStore((s) => s.status);
  const mySeat = useGameStore((s) => s.mySeat);
  const [seconds, setSeconds] = useState(TURN_DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSeconds(TURN_DURATION);
    if (status !== "playing") return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentTurn, status]);

  if (status !== "playing") return null;

  const isMyTurn = mySeat !== null && currentTurn === mySeat;
  const pct = seconds / TURN_DURATION;
  const urgent = seconds <= 10;

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-[#1e5c3a]/50 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${urgent ? "bg-red-500" : isMyTurn ? "bg-[#c9a84c]" : "bg-[#a8c4a0]/40"}`}
          initial={{ width: "100%" }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span
        className={`text-[10px] font-mono tabular-nums ${urgent ? "text-red-400" : "text-[#a8c4a0]/60"}`}
      >
        {seconds}s
      </span>
    </div>
  );
}
