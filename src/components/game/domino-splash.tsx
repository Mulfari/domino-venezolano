"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Tile } from "@/lib/game/types";

interface DominoSplashProps {
  show: boolean;
  playerName: string;
  isMyTeam: boolean;
  reason?: "domino" | "locked";
  tile?: Tile;
  points?: number;
}

function halfPips(val: number, yBase: number): [number, number][] {
  const y1 = yBase + 18, y2 = yBase + 32, y3 = yBase + 46;
  switch (val) {
    case 0: return [];
    case 1: return [[36, y2]];
    case 2: return [[20, y1], [52, y3]];
    case 3: return [[20, y1], [36, y2], [52, y3]];
    case 4: return [[20, y1], [52, y1], [20, y3], [52, y3]];
    case 5: return [[20, y1], [52, y1], [36, y2], [20, y3], [52, y3]];
    case 6: return [[20, yBase+22], [36, yBase+22], [52, yBase+22], [20, yBase+42], [36, yBase+42], [52, yBase+42]];
    default: return [];
  }
}

export function DominoSplash({ show, playerName, isMyTeam, reason = "domino", tile, points }: DominoSplashProps) {
  const isLocked = reason === "locked";
  const displayTile: Tile = tile ?? [6, 6];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="round-end-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeIn" } }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-60 flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            initial={{ scale: 0.55, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.08, opacity: 0, y: -16, transition: { duration: 0.35, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.04 }}
            className="flex flex-col items-center gap-4"
          >
            {isLocked ? (
              /* Trancado: two crossed domino tiles */
              <motion.svg
                width="96" height="72" viewBox="0 0 96 72" fill="none"
                aria-hidden="true"
                animate={{ rotate: [0, -4, 4, -4, 0] }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              >
                <defs>
                  <linearGradient id="lockedFace1" x1="0" y1="0" x2="48" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f8f3ea" />
                    <stop offset="100%" stopColor="#e8e0d0" />
                  </linearGradient>
                  <linearGradient id="lockedFace2" x1="48" y1="48" x2="96" y2="72" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f8f3ea" />
                    <stop offset="100%" stopColor="#e8e0d0" />
                  </linearGradient>
                </defs>
                {/* Tile 1 — top-left, rotated */}
                <g transform="rotate(-18, 24, 20)">
                  <rect x="2" y="4" width="44" height="22" rx="4" fill="url(#lockedFace1)" stroke="#ef4444" strokeWidth="2"/>
                  <line x1="24" y1="5" x2="24" y2="25" stroke="#ef4444" strokeWidth="1.2" opacity="0.7"/>
                  <circle cx="12" cy="15" r="3" fill="#1a1a1a"/>
                  <circle cx="36" cy="11" r="2.5" fill="#1a1a1a"/>
                  <circle cx="36" cy="19" r="2.5" fill="#1a1a1a"/>
                </g>
                {/* Tile 2 — bottom-right, rotated opposite */}
                <g transform="rotate(18, 72, 52)">
                  <rect x="50" y="46" width="44" height="22" rx="4" fill="url(#lockedFace2)" stroke="#ef4444" strokeWidth="2"/>
                  <line x1="72" y1="47" x2="72" y2="67" stroke="#ef4444" strokeWidth="1.2" opacity="0.7"/>
                  <circle cx="60" cy="57" r="3" fill="#1a1a1a"/>
                  <circle cx="84" cy="53" r="2.5" fill="#1a1a1a"/>
                  <circle cx="84" cy="61" r="2.5" fill="#1a1a1a"/>
                </g>
                {/* X cross */}
                <line x1="30" y1="22" x2="66" y2="50" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" opacity="0.9"/>
                <line x1="66" y1="22" x2="30" y2="50" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" opacity="0.9"/>
              </motion.svg>
            ) : (
              /* Dominó: spinning tile showing the actual played tile */
              <motion.svg
                width="72" height="128" viewBox="0 0 72 128" fill="none"
                aria-hidden="true"
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              >
                <defs>
                  <linearGradient id="splashFace" x1="0" y1="0" x2="72" y2="128" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f8f3ea" />
                    <stop offset="100%" stopColor="#e8e0d0" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="68" height="124" rx="8"
                  fill="url(#splashFace)" stroke="#c9a84c" strokeWidth="2.5"
                />
                <line x1="8" y1="64" x2="64" y2="64" stroke="#c9a84c" strokeWidth="1.5" opacity="0.7" />
                {halfPips(displayTile[0], 0).map(([cx, cy], i) => (
                  <circle key={`t-${i}`} cx={cx} cy={cy} r="5" fill="#1a1a1a" />
                ))}
                {halfPips(displayTile[1], 64).map(([cx, cy], i) => (
                  <circle key={`b-${i}`} cx={cx} cy={cy} r="5" fill="#1a1a1a" />
                ))}
              </motion.svg>
            )}

            {/* Main text */}
            <motion.div
              className="flex flex-col items-center gap-1.5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.3 }}
            >
              <motion.span
                className="text-[52px] sm:text-[68px] font-black uppercase leading-none tracking-tight"
                style={{
                  color: isLocked
                    ? "#ef4444"
                    : isMyTeam ? "#c9a84c" : "#f5f0e8",
                  textShadow: isLocked
                    ? "0 0 60px rgba(239,68,68,0.9), 0 0 30px rgba(239,68,68,0.7), 0 4px 20px rgba(0,0,0,0.8)"
                    : isMyTeam
                    ? "0 0 60px rgba(201,168,76,0.9), 0 0 30px rgba(201,168,76,0.7), 0 4px 20px rgba(0,0,0,0.8)"
                    : "0 0 40px rgba(245,240,232,0.5), 0 4px 20px rgba(0,0,0,0.8)",
                }}
                animate={isLocked ? {
                  textShadow: [
                    "0 0 60px rgba(239,68,68,0.9), 0 0 30px rgba(239,68,68,0.7), 0 4px 20px rgba(0,0,0,0.8)",
                    "0 0 90px rgba(239,68,68,1), 0 0 50px rgba(239,68,68,0.9), 0 4px 20px rgba(0,0,0,0.8)",
                    "0 0 60px rgba(239,68,68,0.9), 0 0 30px rgba(239,68,68,0.7), 0 4px 20px rgba(0,0,0,0.8)",
                  ],
                } : isMyTeam ? {
                  textShadow: [
                    "0 0 60px rgba(201,168,76,0.9), 0 0 30px rgba(201,168,76,0.7), 0 4px 20px rgba(0,0,0,0.8)",
                    "0 0 90px rgba(201,168,76,1), 0 0 50px rgba(201,168,76,0.9), 0 4px 20px rgba(0,0,0,0.8)",
                    "0 0 60px rgba(201,168,76,0.9), 0 0 30px rgba(201,168,76,0.7), 0 4px 20px rgba(0,0,0,0.8)",
                  ],
                } : {}}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              >
                {isLocked ? "¡Trancado!" : "¡Dominó!"}
              </motion.span>

              <motion.span
                className="text-[15px] sm:text-[18px] font-semibold tracking-widest uppercase"
                style={{
                  color: isLocked
                    ? "rgba(239,68,68,0.85)"
                    : isMyTeam ? "rgba(201,168,76,0.85)" : "rgba(245,240,232,0.65)",
                  textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38, duration: 0.25 }}
              >
                {isLocked ? "Juego bloqueado" : playerName}
              </motion.span>

              {/* Points earned badge */}
              {points !== undefined && points > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.52, type: "spring", stiffness: 380, damping: 22 }}
                  className="flex items-center gap-2 rounded-full px-5 py-2 mt-1"
                  style={{
                    background: isLocked
                      ? "rgba(239,68,68,0.12)"
                      : isMyTeam
                      ? "rgba(201,168,76,0.15)"
                      : "rgba(245,240,232,0.08)",
                    border: `1.5px solid ${isLocked ? "rgba(239,68,68,0.45)" : isMyTeam ? "rgba(201,168,76,0.5)" : "rgba(245,240,232,0.2)"}`,
                    boxShadow: isMyTeam && !isLocked ? "0 0 20px rgba(201,168,76,0.25)" : undefined,
                  }}
                >
                  <motion.span
                    className="text-[28px] sm:text-[34px] font-black tabular-nums leading-none"
                    style={{
                      color: isLocked ? "#ef4444" : isMyTeam ? "#c9a84c" : "#f5f0e8",
                      textShadow: isLocked
                        ? "0 0 20px rgba(239,68,68,0.7)"
                        : isMyTeam
                        ? "0 0 20px rgba(201,168,76,0.7)"
                        : "0 0 12px rgba(245,240,232,0.4)",
                    }}
                    animate={isMyTeam && !isLocked ? { scale: [1, 1.06, 1] } : {}}
                    transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                  >
                    +{points}
                  </motion.span>
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest leading-none"
                    style={{
                      color: isLocked
                        ? "rgba(239,68,68,0.6)"
                        : isMyTeam
                        ? "rgba(201,168,76,0.6)"
                        : "rgba(245,240,232,0.4)",
                    }}
                  >
                    pts
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Radial glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none -z-10"
              style={{
                background: isLocked
                  ? "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(239,68,68,0.18) 0%, transparent 70%)"
                  : isMyTeam
                  ? "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.18) 0%, transparent 70%)"
                  : "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(245,240,232,0.08) 0%, transparent 70%)",
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
