"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

const TEAM_COLORS = {
  0: { accent: "#c9a84c", glow: "rgba(201,168,76,0.5)" },
  1: { accent: "#4ca8c9", glow: "rgba(76,168,201,0.5)" },
} as const;

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
  const round = useGameStore((s) => s.round);
  const scores = useGameStore((s) => s.scores);
  const targetScore = useGameStore((s) => s.targetScore);
  const mySeat = useGameStore((s) => s.mySeat);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const players = useGameStore((s) => s.players);

  const myTeam = mySeat !== null ? ((mySeat % 2) as 0 | 1) : null;
  const isFirstRound = round === 1;
  const starterPlayer = players.find((p) => p.seat === currentTurn);
  const starterName = starterPlayer?.displayName?.split(" ")[0] ?? `J${currentTurn + 1}`;
  const starterIsMe = mySeat === currentTurn;
  const starterTeam = (currentTurn % 2) as 0 | 1;

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
          aria-label={`Repartiendo fichas — Ronda ${round}`}
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

          {/* Center content — round context + dealing label */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-2.5"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
          >
            {/* Round number badge */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="flex flex-col items-center gap-0.5"
            >
              <span
                className="text-[8px] uppercase tracking-[0.25em] leading-none font-semibold"
                style={{ color: "rgba(168,196,160,0.55)" }}
              >
                Ronda
              </span>
              <motion.span
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
                className="text-[28px] font-black tabular-nums leading-none"
                style={{ color: "#c9a84c", textShadow: "0 0 24px rgba(201,168,76,0.5)" }}
              >
                {round}
              </motion.span>
            </motion.div>

            {/* Score summary — compact team scores */}
            {(scores[0] > 0 || scores[1] > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.25 }}
                className="flex items-center gap-3"
              >
                {([0, 1] as const).map((team) => {
                  const isMyTeam = myTeam === team;
                  const color = TEAM_COLORS[team].accent;
                  const pct = Math.min((scores[team] / (targetScore || 100)) * 100, 100);
                  return (
                    <div key={team} className="flex flex-col items-center gap-1 min-w-[48px]">
                      <span
                        className="text-[7px] uppercase tracking-widest font-bold leading-none"
                        style={{ color: isMyTeam ? color : "rgba(168,196,160,0.5)" }}
                      >
                        {isMyTeam ? "◆ Tú" : "Rival"}
                      </span>
                      <span
                        className="text-[16px] font-bold tabular-nums leading-none"
                        style={{ color, textShadow: isMyTeam ? `0 0 10px ${TEAM_COLORS[team].glow}` : undefined }}
                      >
                        {scores[team]}
                      </span>
                      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Decorative divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="h-px w-28 bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent"
            />

            {/* Domino icon + "Repartiendo" */}
            <div className="flex flex-col items-center gap-1.5">
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
            </div>

            {/* Who starts — pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: `1px solid ${TEAM_COLORS[starterTeam].accent}35`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: TEAM_COLORS[starterTeam].accent }}
                aria-hidden="true"
              />
              <span
                className="text-[9px] uppercase tracking-widest leading-none font-semibold"
                style={{ color: "rgba(168,196,160,0.6)" }}
              >
                {isFirstRound ? "Cochina" : "Empieza"}
              </span>
              <span
                className="text-[10px] font-bold leading-none truncate max-w-[80px]"
                style={{
                  color: starterIsMe ? "#c9a84c" : TEAM_COLORS[starterTeam].accent,
                  textShadow: starterIsMe ? "0 0 8px rgba(201,168,76,0.5)" : undefined,
                }}
              >
                {starterIsMe ? "¡Tú!" : starterName}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
