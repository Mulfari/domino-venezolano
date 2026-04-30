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

const MAX_DISPLAY = 7;

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
  const maxDisplay = isMobile ? (isVertical ? 3 : 5) : MAX_DISPLAY;
  const displayCount = Math.min(tileCount, maxDisplay);

  // Overlap: tighter for vertical stacks, looser fan for horizontal
  const overlapPx = isMobile ? (isVertical ? 14 : 12) : (isVertical ? 18 : 16);

  return (
    <div
      className={`relative flex items-center gap-1.5 sm:gap-2 overflow-visible ${
        isVertical ? "flex-col" : "flex-col-reverse"
      }`}
      role="region"
      aria-label={`Mano de ${playerName}: ${tileCount} fichas${isCurrentTurn ? ", turno activo" : ""}`}
    >
      <PassIndicator show={showPass} playerName={playerName} />

      {/* Player name + connection dot */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <motion.div
          className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full flex-shrink-0 ${
            connected ? "bg-[#4ade80]" : "bg-red-400"
          }`}
          role="img"
          aria-label={connected ? `${playerName} conectado` : `${playerName} desconectado`}
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

      {/* Face-down tile stack */}
      {tileCount > 0 && (
        <div className="relative" aria-hidden="true">
          <div
            className={`flex items-end justify-center ${
              isVertical ? "flex-col" : "flex-row"
            }`}
          >
            {Array.from({ length: displayCount }).map((_, i) => {
              const offset = i - (displayCount - 1) / 2;

              // Horizontal: fan spread with rotation + arc lift
              // Vertical: straight stack with slight x-shift for depth
              const rotation = !isVertical ? offset * 6 : 0;
              const yLift = !isVertical ? -Math.abs(offset) * 3 : 0;
              const xShift = isVertical ? offset * 1.5 : 0;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5, y: isVertical ? -8 : 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 340,
                    damping: 20,
                  }}
                  style={{
                    marginTop: isVertical && i > 0 ? `-${overlapPx}px` : undefined,
                    marginLeft: !isVertical && i > 0 ? `-${overlapPx}px` : undefined,
                    transform: `rotate(${rotation}deg) translateY(${yLift}px) translateX(${xShift}px)`,
                    transformOrigin: "bottom center",
                    zIndex: i,
                    // Slight perspective depth: tiles further from center appear slightly smaller
                    filter: isVertical && i < displayCount - 1
                      ? "brightness(0.88)"
                      : undefined,
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
            className={`absolute -bottom-3 -right-3 z-20
              flex items-center justify-center
              min-w-[22px] sm:min-w-[26px] h-[22px] sm:h-[26px] px-1.5
              rounded-full text-[11px] sm:text-[12px] font-black leading-none
              shadow-lg border-2
              ${isCurrentTurn
                ? "bg-[#c9a84c] text-[#1a0800] border-[#f0d878] shadow-[0_0_12px_rgba(201,168,76,0.9)]"
                : "bg-[#1e0e04] text-[#d4a855] border-[#7a4a22] shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
              }`}
            aria-hidden="true"
          >
            {tileCount}
          </motion.div>
        </div>
      )}

      {/* Empty hand indicator */}
      {tileCount === 0 && (
        <div className="text-[9px] sm:text-[10px] text-[#5a7a5a] italic">
          sin fichas
        </div>
      )}
    </div>
  );
}
