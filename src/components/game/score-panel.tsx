"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

export function ScorePanel() {
  const scores = useGameStore((s) => s.scores);
  const round = useGameStore((s) => s.round);
  const targetScore = useGameStore((s) => s.targetScore);

  const teamAWinning = scores[0] > scores[1];
  const teamBWinning = scores[1] > scores[0];
  const tied = scores[0] === scores[1];

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm p-2 sm:p-3 min-w-0 sm:min-w-[160px]">
      <div className="text-center mb-1 sm:mb-2">
        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500">
          Ronda {round}
        </span>
        <span className="text-[9px] sm:text-[10px] text-slate-600 ml-1">
          ({targetScore})
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-emerald-500 font-medium">
            Eq. A
          </span>
          <motion.span
            key={scores[0]}
            initial={{ scale: 1.3, color: "#10b981" }}
            animate={{ scale: 1, color: teamAWinning ? "#10b981" : tied ? "#94a3b8" : "#64748b" }}
            className="text-lg sm:text-2xl font-bold tabular-nums"
          >
            {scores[0]}
          </motion.span>
        </div>

        <span className="text-slate-700 text-sm sm:text-lg font-light">vs</span>

        <div className="flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-500 font-medium">
            Eq. B
          </span>
          <motion.span
            key={scores[1]}
            initial={{ scale: 1.3, color: "#f59e0b" }}
            animate={{ scale: 1, color: teamBWinning ? "#f59e0b" : tied ? "#94a3b8" : "#64748b" }}
            className="text-lg sm:text-2xl font-bold tabular-nums"
          >
            {scores[1]}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
