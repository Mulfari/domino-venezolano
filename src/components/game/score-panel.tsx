"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

export function ScorePanel() {
  const scores = useGameStore((s) => s.scores);
  const round = useGameStore((s) => s.round);
  const targetScore = useGameStore((s) => s.targetScore);
  const mySeat = useGameStore((s) => s.mySeat);

  const myTeam = mySeat !== null ? (mySeat % 2) as 0 | 1 : null;
  const teamAWinning = scores[0] > scores[1];
  const teamBWinning = scores[1] > scores[0];
  const tied = scores[0] === scores[1];

  return (
    <div className="rounded-2xl bg-[#3a2210]/80 border border-[#c9a84c]/20 backdrop-blur-sm p-2 sm:p-3 min-w-0 sm:min-w-[160px]">
      <div className="text-center mb-1 sm:mb-2">
        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#a8c4a0]/60">
          Ronda {round}
        </span>
        <span className="text-[9px] sm:text-[10px] text-[#a8c4a0]/40 ml-1">
          meta: {targetScore}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex flex-col items-center">
          <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-medium ${myTeam === 0 ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}>
            {myTeam === 0 ? "Tú" : "Ellos"}
          </span>
          <motion.span
            key={scores[0]}
            initial={{ scale: 1.3, color: "#f5f0e8" }}
            animate={{ scale: 1, color: teamAWinning ? "#f5f0e8" : tied ? "#a8c4a0" : "#6b8a60" }}
            className="text-lg sm:text-2xl font-bold tabular-nums"
          >
            {scores[0]}
          </motion.span>
        </div>

        <span className="text-[#c9a84c]/40 text-sm sm:text-lg font-light">—</span>

        <div className="flex flex-col items-center">
          <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-medium ${myTeam === 1 ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}>
            {myTeam === 1 ? "Tú" : "Ellos"}
          </span>
          <motion.span
            key={scores[1]}
            initial={{ scale: 1.3, color: "#c9a84c" }}
            animate={{ scale: 1, color: teamBWinning ? "#c9a84c" : tied ? "#a8c4a0" : "#6b8a60" }}
            className="text-lg sm:text-2xl font-bold tabular-nums"
          >
            {scores[1]}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
