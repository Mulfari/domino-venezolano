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
  disableHover?: boolean;
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
  large: { w: 38, h: 68, pip: 4, gap: 2 },
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

function PipDots({ value, pipSize, halfWidth, halfHeight, horizontal = false, pipGradientId, pipShineId, pipRimId }: {
  value: number;
  pipSize: number;
  halfWidth: number;
  halfHeight: number;
  horizontal?: boolean;
  pipGradientId: string;
  pipShineId: string;
  pipRimId: string;
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
          <g key={i}>
            {/* Subtle inset shadow ring */}
            <circle cx={cx} cy={cy + pipSize * 0.15} r={pipSize * 0.92} fill="rgba(0,0,0,0.35)" />
            <circle cx={cx} cy={cy} r={pipSize} fill={`url(#${pipGradientId})`} />
            <circle cx={cx} cy={cy} r={pipSize} fill={`url(#${pipRimId})`} />
            <circle cx={cx} cy={cy} r={pipSize} fill={`url(#${pipShineId})`} />
          </g>
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
  disableHover = false,
  onClick,
}: TileProps) {
  const isMobile = useIsMobile();
  const config = responsive && isMobile ? mobileSizeConfig : sizeConfig;
  const { w: baseW, h: baseH, pip, gap } = config[size];
  const borderRadius = size === "small" ? 6 : size === "medium" ? 9 : 13;
  const uid = useId().replace(/:/g, "");

  const isHorizontal = orientation === "horizontal";
  const w = isHorizontal ? baseH : baseW;
  const h = isHorizontal ? baseW : baseH;

  const showFace = !faceDown && tile;
  const ornSize = Math.min(w, h) * 0.14;
  const cornerPipR = Math.min(w, h) * 0.055;
  const cornerPad = Math.min(w, h) * 0.2;

  const svgContent = (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`${highlight ? "drop-shadow-[0_0_12px_rgba(201,168,76,0.98)]" : ""} ${disabled ? "opacity-55" : ""}`}
      style={highlight
        ? { filter: "drop-shadow(0 0 12px rgba(201,168,76,0.98)) drop-shadow(0 0 4px rgba(201,168,76,0.6))" }
        : !faceDown
          ? { filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5)) drop-shadow(0 4px 8px rgba(0,0,0,0.35)) drop-shadow(0 8px 20px rgba(0,0,0,0.15))" }
          : { filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.6)) drop-shadow(0 5px 12px rgba(0,0,0,0.45)) drop-shadow(0 10px 24px rgba(0,0,0,0.2))" }}
    >
      <defs>
        <linearGradient id={`face-${uid}`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#fffef8" />
          <stop offset="12%" stopColor="#fdf8ee" />
          <stop offset="40%" stopColor="#f2e8d8" />
          <stop offset="72%" stopColor="#d8c9b2" />
          <stop offset="100%" stopColor="#b8a080" />
        </linearGradient>
        <radialGradient id={`face-inner-${uid}`} cx="30%" cy="22%" r="68%">
          <stop offset="0%" stopColor="white" stopOpacity="0.45" />
          <stop offset="30%" stopColor="white" stopOpacity="0.15" />
          <stop offset="70%" stopColor="black" stopOpacity="0.08" />
          <stop offset="100%" stopColor="black" stopOpacity="0.28" />
        </radialGradient>
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.42" />
          <stop offset="35%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`edge-shadow-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.16)" />
        </linearGradient>
        <linearGradient id={`back-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6b4422" />
          <stop offset="45%" stopColor="#3a2210" />
          <stop offset="100%" stopColor="#1a0c04" />
        </linearGradient>
        <pattern id={`grain-${uid}`} x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
          <line x1="0" y1="0" x2="0" y2="3" stroke="#c07838" strokeWidth="1.2" opacity="0.9"/>
        </pattern>
        <pattern id={`grain2-${uid}`} x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(78)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#2a0e02" strokeWidth="1.0" opacity="0.7"/>
        </pattern>
        <pattern id={`grain3-${uid}`} x="0" y="0" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(5)">
          <line x1="0" y1="0" x2="0" y2="9" stroke="#8a5228" strokeWidth="2.0" opacity="0.5"/>
        </pattern>
        <pattern id={`grain4-${uid}`} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(2)">
          <line x1="0" y1="0" x2="0" y2="18" stroke="#5a2e0a" strokeWidth="3.0" opacity="0.22"/>
        </pattern>
        <radialGradient id={`vignette-${uid}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="#0a0400" stopOpacity="0.72" />
        </radialGradient>
        {/* 3D bevel: bright top/left, dark bottom/right */}
        <linearGradient id={`edge-top-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.52" />
          <stop offset="30%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`edge-bottom-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="black" stopOpacity="0" />
          <stop offset="65%" stopColor="black" stopOpacity="0.35" />
          <stop offset="100%" stopColor="black" stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id={`edge-left-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0.32" />
          <stop offset="40%" stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`edge-right-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="black" stopOpacity="0" />
          <stop offset="60%" stopColor="black" stopOpacity="0.22" />
          <stop offset="100%" stopColor="black" stopOpacity="0.48" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <rect x={0} y={0} width={w} height={h} rx={borderRadius}/>
        </clipPath>
        <radialGradient id={`pip-${uid}`} cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="25%" stopColor="#111111" />
          <stop offset="60%" stopColor="#050505" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        {/* Specular highlight — top-left catch of light on carved edge */}
        <radialGradient id={`pip-shine-${uid}`} cx="22%" cy="18%" r="42%">
          <stop offset="0%" stopColor="white" stopOpacity="0.65" />
          <stop offset="45%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Deep inset rim — stronger shadow at bottom-right */}
        <radialGradient id={`pip-rim-${uid}`} cx="62%" cy="68%" r="52%">
          <stop offset="50%" stopColor="transparent" />
          <stop offset="80%" stopColor="rgba(0,0,0,0.5)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.85)" />
        </radialGradient>
      </defs>
      <rect
        x={0} y={0} width={w} height={h}
        rx={borderRadius}
        fill={faceDown ? `url(#back-${uid})` : `url(#face-${uid})`}
        stroke={
          selected || highlight ? "#c9a84c"
            : faceDown ? "#7a4a22"
              : "#c8bfb0"
        }
        strokeWidth={selected || highlight ? 1.5 : 0.75}
      />

      {/* Surface sheen, inner depth gradient, and bottom edge shadow on face-up tiles */}
      {!faceDown && (
        <>
          <rect x={0} y={0} width={w} height={h} rx={borderRadius} fill={`url(#face-inner-${uid})`} clipPath={`url(#clip-${uid})`} />
          <rect x={0} y={0} width={w} height={h * 0.48} rx={borderRadius} fill={`url(#sheen-${uid})`} clipPath={`url(#clip-${uid})`} />
          <rect x={0} y={0} width={w} height={h} rx={borderRadius} fill={`url(#edge-shadow-${uid})`} clipPath={`url(#clip-${uid})`} />
        </>
      )}

      {faceDown ? (
        <>
          {/* Wood grain layers — fine to coarse for depth */}
          <rect x={0} y={0} width={w} height={h} rx={borderRadius} fill={`url(#grain-${uid})`} clipPath={`url(#clip-${uid})`} opacity={0.85} />
          <rect x={0} y={0} width={w} height={h} rx={borderRadius} fill={`url(#grain2-${uid})`} clipPath={`url(#clip-${uid})`} opacity={0.55} />
          <rect x={0} y={0} width={w} height={h} rx={borderRadius} fill={`url(#grain3-${uid})`} clipPath={`url(#clip-${uid})`} opacity={0.45} />
          <rect x={0} y={0} width={w} height={h} rx={borderRadius} fill={`url(#grain4-${uid})`} clipPath={`url(#clip-${uid})`} opacity={0.35} />
          {/* 3D edge lighting: top/left bright, bottom/right dark */}
          <rect x={0} y={0} width={w} height={h * 0.45} rx={borderRadius} fill={`url(#edge-top-${uid})`} clipPath={`url(#clip-${uid})`} />
          <rect x={0} y={0} width={w} height={h} rx={borderRadius} fill={`url(#edge-bottom-${uid})`} clipPath={`url(#clip-${uid})`} />
          <rect x={0} y={0} width={w * 0.4} height={h} rx={borderRadius} fill={`url(#edge-left-${uid})`} clipPath={`url(#clip-${uid})`} />
          <rect x={0} y={0} width={w} height={h} rx={borderRadius} fill={`url(#edge-right-${uid})`} clipPath={`url(#clip-${uid})`} />
          {/* Vignette to give rounded depth */}
          <rect x={0} y={0} width={w} height={h} rx={borderRadius} fill={`url(#vignette-${uid})`} clipPath={`url(#clip-${uid})`} />
          {/* Outer inset border — warm gold tint */}
          <rect x={1.5} y={1.5} width={w - 3} height={h - 3} rx={borderRadius - 0.5} fill="none" stroke="#c8903a" strokeWidth={1.6} opacity={0.75} />
          {/* Inner decorative frame */}
          <rect x={3.5} y={3.5} width={w - 7} height={h - 7} rx={borderRadius - 2} fill="none" stroke="#8a5e2a" strokeWidth={1.0} opacity={0.8} />
          {/* Divider line */}
          {isHorizontal ? (
            <line x1={w / 2} y1={4} x2={w / 2} y2={h - 4} stroke="#9a6830" strokeWidth={1.0} opacity={0.85} />
          ) : (
            <line x1={4} y1={h / 2} x2={w - 4} y2={h / 2} stroke="#9a6830" strokeWidth={1.0} opacity={0.85} />
          )}
          {/* Center diamond ornament */}
          <polygon
            points={`${w/2},${h/2 - ornSize} ${w/2 + ornSize * 0.65},${h/2} ${w/2},${h/2 + ornSize} ${w/2 - ornSize * 0.65},${h/2}`}
            fill="#5a3010" stroke="#b07838" strokeWidth={1.0} opacity={1.0}
          />
          <polygon
            points={`${w/2},${h/2 - ornSize * 0.55} ${w/2 + ornSize * 0.38},${h/2} ${w/2},${h/2 + ornSize * 0.55} ${w/2 - ornSize * 0.38},${h/2}`}
            fill="none" stroke="#c9a84c" strokeWidth={0.7} opacity={0.75}
          />
          {/* Corner pip accents */}
          <circle cx={cornerPad} cy={cornerPad} r={cornerPipR} fill="#6a3818" stroke="#a06830" strokeWidth={0.7} opacity={0.9} />
          <circle cx={w - cornerPad} cy={cornerPad} r={cornerPipR} fill="#6a3818" stroke="#a06830" strokeWidth={0.7} opacity={0.9} />
          <circle cx={cornerPad} cy={h - cornerPad} r={cornerPipR} fill="#6a3818" stroke="#a06830" strokeWidth={0.7} opacity={0.9} />
          <circle cx={w - cornerPad} cy={h - cornerPad} r={cornerPipR} fill="#6a3818" stroke="#a06830" strokeWidth={0.7} opacity={0.9} />
          {/* Top-left highlight sheen */}
          <rect x={1} y={1} width={w * 0.65} height={h * 0.35} rx={borderRadius - 1} fill="white" opacity={0.13} clipPath={`url(#clip-${uid})`} />
        </>
      ) : showFace ? (
        isHorizontal ? (
          <>
            <g>
              <PipDots value={tile[0]} pipSize={pip} halfWidth={w / 2} halfHeight={h} horizontal pipGradientId={`pip-${uid}`} pipShineId={`pip-shine-${uid}`} pipRimId={`pip-rim-${uid}`} />
            </g>
            <line
              x1={w / 2} y1={3}
              x2={w / 2} y2={h - 3}
              stroke="#c0b8a8" strokeWidth={0.6}
            />
            <g transform={`translate(${w / 2}, 0)`}>
              <PipDots value={tile[1]} pipSize={pip} halfWidth={w / 2} halfHeight={h} horizontal pipGradientId={`pip-${uid}`} pipShineId={`pip-shine-${uid}`} pipRimId={`pip-rim-${uid}`} />
            </g>
          </>
        ) : (
          <>
            <g>
              <PipDots value={tile[0]} pipSize={pip} halfWidth={w} halfHeight={(h - gap) / 2} pipGradientId={`pip-${uid}`} pipShineId={`pip-shine-${uid}`} pipRimId={`pip-rim-${uid}`} />
            </g>
            <line
              x1={3} y1={(h - gap) / 2 + gap / 2}
              x2={w - 3} y2={(h - gap) / 2 + gap / 2}
              stroke="#c0b8a8" strokeWidth={0.6}
            />
            <g transform={`translate(0, ${(h - gap) / 2 + gap})`}>
              <PipDots value={tile[1]} pipSize={pip} halfWidth={w} halfHeight={(h - gap) / 2} pipGradientId={`pip-${uid}`} pipShineId={`pip-shine-${uid}`} pipRimId={`pip-rim-${uid}`} />
            </g>
          </>
        )
      ) : null}
    </svg>
  );

  const sharedAttrs = {
    className: `inline-block ${clickable && !disabled ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-1 focus-visible:rounded-lg" : ""}`,
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
    "aria-pressed": clickable && selected ? true : undefined,
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
      whileHover={clickable && !disabled && !disableHover ? { scale: 1.12, y: -6 } : undefined}
      whileTap={clickable && !disabled ? { scale: 0.95 } : undefined}
      animate={selected ? { y: -12, scale: 1.08 } : { y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {svgContent}
    </motion.div>
  );
}
