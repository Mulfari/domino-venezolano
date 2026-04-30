"use client";

import { motion } from "framer-motion";
import { DominoTile } from "./tile";
import { PassIndicator } from "./pass-indicator";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Seat } from "@/lib/game/types";

interface OpponentHandProps {
  seat: Seat;
  tileCount: number;
  playerName: string;
  connected?: boolean;
  isCurrentTurn?: boolean;
  position: "top" | "left" | "right";
  showPass?: boolean;
}

export function OpponentHand({
  tileCount,
  playerName,
  connected = true,
  isCurrentTurn = false,
  position,
  showPass = false,
}: OpponentHandProps) {
  const isVertical = position === "left" || position === "right";
  const isMobile = useIsMobile();
  // On mobile, lateral opponents show at most 2 tiles to avoid squeezing the board
  const displayCount = isMobile && isVertical ? Math.min(tileCount, 2) : tileCount;

  return (
    <div
      className={`relative flex items-center gap-2 ${
        isVertical ? "flex-col" : "flex-col-reverse"
      }`}
    >
      <PassIndicator show={showPass} />

      {/* Player name + tile count */}
      <div className="flex items-center gap-1 sm:gap-2">
        <motion.div
          className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full flex-shrink-0 ${
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
            isVertical ? "hidden sm:inline" : ""
          } ${isCurrentTurn ? "text-[#c9a84c]" : "text-[#a8c4a0]"}`}
        >
          {playerName}
        </span>
        {/* Tile count pill — always visible */}
        <motion.div
          key={tileCount}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className={`flex-shrink-0 flex items-center justify-center gap-0.5
            min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 px-1.5
            rounded-full text-[10px] sm:text-xs font-bold leading-none
            border shadow-md
            ${isCurrentTurn
              ? "bg-[#c9a84c] text-[#1a0e00] border-[#e8c96a] shadow-[0_0_6px_rgba(201,168,76,0.5)]"
              : "bg-[#2a1a08] text-[#c9a84c] border-[#5c3a1e]"
            }`}
          aria-label={`${tileCount} fichas`}
        >
          {tileCount}
        </motion.div>
      </div>

      {/* Face-down tiles — hidden on mobile for lateral positions to save space */}
      <div className={`relative flex items-center justify-center ${isMobile && isVertical ? "hidden" : ""}`}>
        <div
          className={`flex ${
            isVertical ? "flex-col gap-0.5" : "flex-row gap-0.5"
          } items-center`}
        >
          {Array.from({ length: displayCount }).map((_, i) => (
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
        {/* Floating tile count badge overlaid on the stack */}
        {tileCount > 0 && (
          <motion.div
            key={tileCount}
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className={`absolute -bottom-2 -right-2 z-10
              flex items-center justify-center
              min-w-[18px] sm:min-w-[22px] h-[18px] sm:h-[22px] px-1
              rounded-full text-[10px] sm:text-[11px] font-black leading-none
              shadow-lg border
              ${isCurrentTurn
                ? "bg-[#c9a84c] text-[#1a0800] border-[#f0d878] shadow-[0_0_8px_rgba(201,168,76,0.7)]"
                : "bg-[#1e0e04] text-[#d4a855] border-[#7a4a22]"
              }`}
            aria-hidden="true"
          >
            {tileCount}
          </motion.div>
        )}
      </div>
    </div>
  );
}
