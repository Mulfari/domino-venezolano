"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tile as TileType } from "@/lib/game/types";

type TileSize = "small" | "medium" | "large";

interface TileProps {
  tile?: TileType;
  faceDown?: boolean;
  size?: TileSize;
  orientation?: "vertical" | "horizontal";
  clickable?: boolean;
  disabled?: boolean;
  selected?: boolean;
  highlight?: boolean;
  responsive?: boolean;
  onClick?: () => void;
}

// Vertical tiles: w < h (portrait orientation)
const sizeConfig: Record<TileSize, { w: number; h: number; pip: number; gap: number }> = {
  small: { w: 20, h: 36, pip: 2.5, gap: 1 },
  medium: { w: 30, h: 56, pip: 3.5, gap: 2 },
  large: { w: 40, h: 76, pip: 4.5, gap: 2 },
};

const mobileSizeConfig: Record<TileSize, { w: number; h: number; pip: number; gap: number }> = {
  small: { w: 16, h: 28, pip: 2, gap: 1 },
  medium: { w: 22, h: 42, pip: 2.5, gap: 1 },
  large: { w: 32, h: 58, pip: 3.5, gap: 2 },
};

function getPipPositions(value: number): [number, number][] {
  const positions: Record<number, [number, number][]> = {
    0: [],
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
  };
  return positions[value] ?? [];
}

function PipDots({ value, pipSize, halfWidth, halfHeight, horizontal = false, pipGradientId }: {
  value: number;
  pipSize: number;
  halfWidth: number;
  halfHeight: number;
  horizontal?: boolean;
  pipGradientId: string;
}) {
  const positions = getPipPositions(value);
  const padX = halfWidth * 0.22;
  const padY = halfHeight * 0.18;
  const areaW = halfWidth - padX * 2;
  const areaH = halfHeight - padY * 2;

  return (
    <>
      {positions.map(([col, row], i) => {
        const cx = horizontal
          ? padX + (areaW * row) / 2
          : padX + (areaW * col) / 2;
        const cy = horizontal
          ? padY + (areaH * col) / 2
          : padY + (areaH * row) / 2;
        return (
          <circle key={i} cx={cx} cy={cy} r={pipSize} fill={`url(#${pipGradientId})`} />
        );
      })}
    </>
  );
}

export function DominoTile({
  tile,
  faceDown = false,
  size = "medium",
  orientation = "vertical",
  clickable = false,
  disabled = false,
  selected = false,
  highlight = false,
  responsive = false,
  onClick,
}: TileProps) {
  const isMobile = useIsMobile();
  const config = responsive && isMobile ? mobileSizeConfig : sizeConfig;
  const { w: baseW, h: baseH, pip, gap } = config[size];
  const borderRadius = size === "small" ? 4 : 6;
  const uid = useId().replace(/:/g, "");

  const isHorizontal = orientation === "horizontal";
  const w = isHorizontal ? baseH : baseW;
  const h = isHorizontal ? baseW : baseH;

  const showFace = !faceDown && tile;

  const svgContent = (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      className={`${highlight ? "drop-shadow-[0_0_6px_rgba(201,168,76,0.8)]" : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"} ${disabled ? "opacity-55" : ""}`}
    >
      <defs>
        <linearGradient id={`face-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fdfaf3" />
          <stop offset="60%" stopColor="#f5f0e8" />
          <stop offset="100%" stopColor="#e8e0d0" />
        </linearGradient>
        <linearGradient id={`back-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a2e14" />
          <stop offset="100%" stopColor="#2a1608" />
        </linearGradient>
        <radialGradient id={`pip-${uid}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>
      </defs>
      <rect
        x={0} y={0} width={w} height={h}
        rx={borderRadius}
        fill={faceDown ? `url(#back-${uid})` : `url(#face-${uid})`}
        stroke={
          selected || highlight ? "#c9a84c"
            : faceDown ? "#5c3a1e"
              : "#c8bfb0"
        }
        strokeWidth={selected || highlight ? 1.5 : 0.75}
      />

      {faceDown ? (
        <>
          <rect x={3} y={3} width={w - 6} height={h - 6} rx={2} fill="#2a1a0a" stroke="#5c3a1e" strokeWidth={0.5} />
          {isHorizontal ? (
            <line x1={w / 2} y1={3} x2={w / 2} y2={h - 3} stroke="#5c3a1e" strokeWidth={0.5} />
          ) : (
            <line x1={3} y1={h / 2} x2={w - 3} y2={h / 2} stroke="#5c3a1e" strokeWidth={0.5} />
          )}
        </>
      ) : showFace ? (
        isHorizontal ? (
          <>
            <g>
              <PipDots value={tile[0]} pipSize={pip} halfWidth={w / 2} halfHeight={h} horizontal pipGradientId={`pip-${uid}`} />
            </g>
            <line
              x1={w / 2} y1={3}
              x2={w / 2} y2={h - 3}
              stroke="#c0b8a8" strokeWidth={0.6}
            />
            <g transform={`translate(${w / 2}, 0)`}>
              <PipDots value={tile[1]} pipSize={pip} halfWidth={w / 2} halfHeight={h} horizontal pipGradientId={`pip-${uid}`} />
            </g>
          </>
        ) : (
          <>
            <g>
              <PipDots value={tile[0]} pipSize={pip} halfWidth={w} halfHeight={(h - gap) / 2} pipGradientId={`pip-${uid}`} />
            </g>
            <line
              x1={3} y1={(h - gap) / 2 + gap / 2}
              x2={w - 3} y2={(h - gap) / 2 + gap / 2}
              stroke="#c0b8a8" strokeWidth={0.6}
            />
            <g transform={`translate(0, ${(h - gap) / 2 + gap})`}>
              <PipDots value={tile[1]} pipSize={pip} halfWidth={w} halfHeight={(h - gap) / 2} pipGradientId={`pip-${uid}`} />
            </g>
          </>
        )
      ) : null}
    </svg>
  );

  const sharedAttrs = {
    className: `inline-block ${clickable && !disabled ? "cursor-pointer" : ""}`,
    onClick: clickable && !disabled ? onClick : undefined,
    onKeyDown: clickable && !disabled
      ? (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); }
        }
      : undefined,
    tabIndex: clickable && !disabled ? 0 : undefined,
    role: clickable ? ("button" as const) : undefined,
    "aria-label": tile
      ? `Ficha ${tile[0]}-${tile[1]}${selected ? ", seleccionada" : ""}${disabled ? ", no jugable" : ""}`
      : faceDown ? "Ficha boca abajo" : undefined,
    "aria-disabled": clickable && disabled ? true : undefined,
  };

  // Static tiles (board, opponent hand) skip Framer Motion entirely to avoid
  // per-frame JS overhead when many tiles are rendered simultaneously.
  if (!clickable && !selected) {
    return <div {...sharedAttrs}>{svgContent}</div>;
  }

  return (
    <motion.div
      {...sharedAttrs}
      whileHover={clickable && !disabled ? { scale: 1.12, y: -6 } : undefined}
      whileTap={clickable && !disabled ? { scale: 0.95 } : undefined}
      animate={selected ? { y: -12, scale: 1.08 } : { y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {svgContent}
    </motion.div>
  );
}
