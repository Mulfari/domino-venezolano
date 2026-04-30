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

// Medium tiles are large enough to show wood grain details clearly
const MAX_DISPLAY = 5;

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
  const maxDisplay = isMobile ? (isVertical ? 3 : 4) : MAX_DISPLAY;
  const displayCount = Math.min(tileCount, maxDisplay);

  // More overlap to keep the stack compact with medium-sized tiles
  const overlapPx = isMobile ? 10 : 14;

  return (
    <div
      className={`relative flex items-center gap-1.5 sm:gap-2 overflow-visible ${
        isVertical ? "flex-col" : "flex-col-reverse"
      }`}
    >
      <PassIndicator show={showPass} playerName={playerName} />

      {/* Player name + connection dot + tile count */}
      <div className="flex items-center gap-1 sm:gap-1.5">
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

        {/* Tile count pill — always visible next to name */}
        <motion.div
          key={tileCount}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className={`flex-shrink-0 flex items-center justify-center
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

      {/* Face-down tiles — overlapping fan/stack arrangement */}
      {tileCount > 0 && (
        <div className="relative">
          <div
            className={`flex items-end justify-center ${
              isVertical ? "flex-col" : "flex-row"
            }`}
          >
            {Array.from({ length: displayCount }).map((_, i) => {
              const offset = i - (displayCount - 1) / 2;
              const rotation = !isVertical ? offset * 3.5 : 0;
              const yLift = !isVertical ? -Math.abs(offset) * 1.5 : 0;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.6, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 380, damping: 22 }}
                  style={{
                    marginTop: isVertical && i > 0 ? `-${overlapPx}px` : undefined,
                    marginLeft: !isVertical && i > 0 ? `-${overlapPx}px` : undefined,
                    transform: `rotate(${rotation}deg) translateY(${yLift}px)`,
                    transformOrigin: "bottom center",
                    zIndex: i,
                  }}
                >
                  <DominoTile
                    faceDown
                    size="medium"
                    responsive
                    orientation={isVertical ? "horizontal" : "vertical"}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Count badge overlaid on the tile stack */}
          <motion.div
            key={`badge-${tileCount}`}
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className={`absolute -bottom-2.5 -right-2.5 z-20
              flex items-center justify-center
              min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 px-1.5
              rounded-full text-[10px] sm:text-[11px] font-black leading-none
              shadow-lg border
              ${isCurrentTurn
                ? "bg-[#c9a84c] text-[#1a0800] border-[#f0d878] shadow-[0_0_10px_rgba(201,168,76,0.8)]"
                : "bg-[#1e0e04] text-[#d4a855] border-[#7a4a22]"
              }`}
            aria-hidden="true"
          >
            {tileCount}
          </motion.div>
        </div>
      )}
    </div>
  );
}
