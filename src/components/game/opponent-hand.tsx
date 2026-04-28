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
        isVertical ? "flex-col" : "flex-col"
      }`}
    >
      {/* Player name + status */}
      <div className="flex items-center gap-2">
        <motion.div
          className={`h-2 w-2 rounded-full ${
            connected ? "bg-emerald-400" : "bg-red-400"
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
          className={`text-xs font-medium ${
            isCurrentTurn ? "text-amber-400" : "text-slate-400"
          }`}
        >
          {playerName}
        </span>
        <span className="text-[10px] text-slate-600">({tileCount})</span>
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
              rotation={isVertical ? 90 : 0}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
