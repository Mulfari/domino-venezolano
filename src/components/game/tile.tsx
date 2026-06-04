"use client";
import { motion } from "framer-motion";
import { decodeTile } from "@/lib/game/tiles";
import { TILE, COLORS } from "@/lib/game/constants";

interface TileProps {
  tileId: number;
  size?: "normal" | "hand" | "small";
  orientation?: "horizontal" | "vertical";
  state?: "normal" | "playable" | "disabled" | "ghost" | "selected";
  onClick?: () => void;
  showPips?: boolean;
  flipped?: boolean; // when true, render [b, a] instead of [a, b]
}

export function Tile({
  tileId,
  size = "normal",
  orientation = "horizontal",
  state = "normal",
  onClick,
  showPips = true,
  flipped = false,
}: TileProps) {
  const isDouble = (() => {
    const [a, b] = decodeTile(tileId);
    return a === b;
  })();

  const scale = size === "hand" ? TILE.HAND_SCALE : size === "small" ? 0.5 : 1;
  const w = orientation === "vertical" ? TILE.DOUBLE_W * scale : TILE.W * scale;
  const h = orientation === "vertical" ? TILE.DOUBLE_H * scale : TILE.H * scale;

  const [a, b] = decodeTile(tileId);
  const renderA = flipped ? b : a;
  const renderB = flipped ? a : b;

  return (
    <motion.div
      onClick={onClick}
      whileHover={state === "playable" ? { y: -8 } : undefined}
      className={`relative inline-block ${onClick ? "cursor-pointer" : "cursor-default"} ${
        state === "disabled" ? "opacity-50" : ""
      } ${state === "ghost" ? "opacity-50 outline outline-2 outline-gold" : ""}`}
      style={{
        width: w,
        height: h,
        background: `linear-gradient(135deg, ${COLORS.ivory}, #d4c9a8)`,
        border: `2px solid ${COLORS.gold}`,
        borderRadius: 6,
        boxShadow: "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
      }}
    >
      {showPips && (
        <div className="absolute inset-0 flex items-center justify-around">
          <PipColumn value={renderA} half="left" orientation={orientation} />
          {isDouble && orientation === "horizontal" && (
            <div className="absolute inset-y-2 left-1/2 w-px bg-gold/40" />
          )}
          {isDouble && orientation === "vertical" && (
            <div className="absolute inset-x-2 top-1/2 h-px bg-gold/40" />
          )}
          <PipColumn value={renderB} half="right" orientation={orientation} />
        </div>
      )}
    </motion.div>
  );
}

function PipColumn({ value, half, orientation }: { value: number; half: "left" | "right"; orientation: "horizontal" | "vertical" }) {
  if (value === 0) return null;
  // Simplified pip placement (2-column grid)
  const positions: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.25, 0.25], [0.75, 0.75]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.25, 0.2], [0.75, 0.2], [0.25, 0.5], [0.75, 0.5], [0.25, 0.8], [0.75, 0.8]],
  };
  const pips = positions[value] || [];
  return (
    <div className="relative w-full h-full">
      {pips.map(([px, py], i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${px * 100}%`,
            top: `${py * 100}%`,
            width: 6,
            height: 6,
            background: `radial-gradient(circle, #444, ${COLORS.pip})`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
