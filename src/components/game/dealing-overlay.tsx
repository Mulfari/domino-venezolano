"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

// Face-down domino tile SVG
function FaceDownTile({ size = 20 }: { size?: number }) {
  const W = size;
  const H = size * 1.8;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} rx={3}
        fill="#1a3a28" stroke="rgba(201,168,76,0.5)" strokeWidth={1.2} />
      <rect x={3} y={3} width={W - 6} height={H - 6} rx={2}
        fill="none" stroke="rgba(201,168,76,0.18)" strokeWidth={0.8} />
      <line x1={W * 0.25} y1={H / 2} x2={W * 0.75} y2={H / 2}
        stroke="rgba(201,168,76,0.3)" strokeWidth={0.8} />
      <circle cx={W / 2} cy={H * 0.28} r={W * 0.12} fill="rgba(201,168,76,0.25)" />
      <circle cx={W / 2} cy={H * 0.72} r={W * 0.12} fill="rgba(201,168,76,0.25)" />
    </svg>
  );
}

// One tile flying from center to a target position
function FlyingTile({
  index,
  targetX,
  targetY,
  delay,
}: {
  index: number;
  targetX: number;
  targetY: number;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: "50%", top: "50%", x: "-50%", y: "-50%" }}
      initial={{ opacity: 0, x: "-50%", y: "-50%", scale: 0.6, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 0.7],
        x: [`-50%`, `calc(-50% + ${targetX}px)`],
        y: [`-50%`, `calc(-50% + ${targetY}px)`],
        scale: [0.6, 1, 0.85],
        rotate: [0, (index % 2 === 0 ? 8 : -8) * (Math.random() > 0.5 ? 1 : -1)],
      }}
      transition={{
        duration: 0.45,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <FaceDownTile size={18} />
    </motion.div>
  );
}

// Stacked tile pile at a player position
function TilePile({
  x,
  y,
  delay,
  count = 7,
}: {
  x: number;
  y: number;
  delay: number;
  count?: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none flex items-center justify-center"
      style={{ left: "50%", top: "50%", x: x - 14, y: y - 25 }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + 0.35, duration: 0.25, ease: "backOut" }}
    >
      {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            transform: `translateX(${i * 1.5}px) translateY(${-i * 1.5}px)`,
            zIndex: i,
          }}
        >
          <FaceDownTile size={16} />
        </div>
      ))}
    </motion.div>
  );
}

const PLAYER_POSITIONS = [
  { x: 0,    y: -130, label: "arriba"      },
  { x: 140,  y: 0,    label: "derecha"     },
  { x: 0,    y: 130,  label: "abajo"       },
  { x: -140, y: 0,    label: "izquierda"   },
] as const;

const TILES_PER_PLAYER = 7;

export function DealingOverlay() {
  const status = useGameStore((s) => s.status);

  return (
    <AnimatePresence>
      {status === "dealing" && (
        <motion.div
          key="dealing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden rounded-xl"
          style={{
            background: "rgba(8,20,12,0.82)",
            backdropFilter: "blur(3px)",
          }}
          aria-live="polite"
          aria-label="Repartiendo fichas"
        >
          {/* Flying tiles — 7 per player, staggered */}
          {PLAYER_POSITIONS.map((pos, playerIdx) =>
            Array.from({ length: TILES_PER_PLAYER }).map((_, tileIdx) => (
              <FlyingTile
                key={`${playerIdx}-${tileIdx}`}
                index={playerIdx * TILES_PER_PLAYER + tileIdx}
                targetX={pos.x}
                targetY={pos.y}
                delay={playerIdx * 0.12 + tileIdx * 0.045}
              />
            ))
          )}

          {/* Tile piles at each player position after dealing */}
          {PLAYER_POSITIONS.map((pos, playerIdx) => (
            <TilePile
              key={`pile-${playerIdx}`}
              x={pos.x}
              y={pos.y}
              delay={playerIdx * 0.12 + (TILES_PER_PLAYER - 1) * 0.045}
            />
          ))}

          {/* Center label */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
          >
            {/* Domino icon */}
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="36" height="20" viewBox="0 0 36 20" fill="none" aria-hidden="true">
                <rect x="0.75" y="0.75" width="34.5" height="18.5" rx="3.5"
                  fill="#1a3a28" stroke="#c9a84c" strokeWidth="1.5" />
                <line x1="18" y1="1.5" x2="18" y2="18.5" stroke="#c9a84c" strokeWidth="1" />
                <circle cx="9" cy="10" r="2.5" fill="#c9a84c" />
                <circle cx="27" cy="10" r="2.5" fill="#c9a84c" />
              </svg>
            </motion.div>

            {/* Text */}
            <div className="flex flex-col items-center gap-1">
              <span
                className="text-[13px] font-black uppercase tracking-[0.2em] leading-none"
                style={{ color: "#c9a84c", textShadow: "0 0 16px rgba(201,168,76,0.6)" }}
              >
                Repartiendo
              </span>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "rgba(201,168,76,0.7)" }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.1, 0.7] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: i * 0.22,
                      ease: "easeInOut",
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
