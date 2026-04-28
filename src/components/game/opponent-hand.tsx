"use client";

import { motion } from "framer-motion";
import { DominoTile } from "./tile";
import type { Seat } from "@/lib/game/types";

interface OpponentHandProps {
  seat: Seat;
  tileCount: number;
  playerName: string;
  connected?: boolean;
  isCurrentTurn?: boolean;
  position: "top" | "left" | "right";
}

export function OpponentHand({
  tileCount,
  playerName,
  connected = true,
  isCurrentTurn = false,
  position,
}: OpponentHandProps) {
  const isVertical = position === "left" || position === "right";

  return (
    <div
      className={`flex items-center gap-2 ${
        isVertical ? "flex-col" : "flex-col-reverse"
      }`}
    >
      {/* Player name + status */}
      <div className="flex items-center gap-1 sm:gap-2">
        <motion.div
          className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${
            connected ? "bg-[#4ade80]" : "bg-red-400"
          }`}
          animate={
            isCurrentTurn
              ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }
              : {}
          }
          transition={
            isCurrentTurn
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : {}
          }
        />
        <span
          className={`text-[10px] sm:text-xs font-medium truncate max-w-[60px] sm:max-w-[100px] ${
            isCurrentTurn ? "text-[#c9a84c]" : "text-[#a8c4a0]"
          }`}
        >
          {playerName}
        </span>
        <span className="text-[9px] sm:text-[10px] text-[#a8c4a0]/40">({tileCount})</span>
      </div>

      {/* Face-down tiles */}
      <div
        className={`flex ${
          isVertical ? "flex-col gap-0.5" : "flex-row gap-0.5"
        } items-center`}
      >
        {Array.from({ length: tileCount }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
          >
            <DominoTile
              faceDown
              size="small"
              responsive
              orientation={isVertical ? "horizontal" : "vertical"}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
