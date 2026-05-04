"use client";

import { motion, AnimatePresence } from "framer-motion";

interface TrancadoSplashProps {
  show: boolean;
  isMyTeam: boolean;
  winnerTeam: 0 | 1 | null;
  points: number;
  myPips?: number;
}

const TEAM_COLORS = {
  0: { main: "#3b82f6", glow: "rgba(59,130,246,0.7)", bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.5)" },
  1: { main: "#ef4444", glow: "rgba(239,68,68,0.7)", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.5)" },
} as const;

function LockIcon() {
  return (
    <svg width="80" height="96" viewBox="0 0 80 96" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lockBody" x1="8" y1="40" x2="72" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b8860b" />
          <stop offset="50%" stopColor="#8b6914" />
          <stop offset="100%" stopColor="#6b4f10" />
        </linearGradient>
        <linearGradient id="lockShackle" x1="16" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d4a843" />
          <stop offset="100%" stopColor="#8b6914" />
        </linearGradient>
        <filter id="lockGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="lockSheen" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="100%" stopColor="black" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      {/* Shackle (U-shape) */}
      <path
        d="M20 44 V24 C20 12 28 4 40 4 C52 4 60 12 60 24 V44"
        stroke="url(#lockShackle)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        filter="url(#lockGlow)"
      />
      {/* Body */}
      <rect x="8" y="40" width="64" height="52" rx="8"
        fill="url(#lockBody)" stroke="#d4a843" strokeWidth="2" />
      {/* Sheen */}
      <rect x="8" y="40" width="64" height="52" rx="8"
        fill="url(#lockSheen)" />
      {/* Keyhole */}
      <circle cx="40" cy="60" r="7" fill="#1a0e00" opacity="0.8" />
      <rect x="37" y="60" width="6" height="14" rx="2" fill="#1a0e00" opacity="0.8" />
    </svg>
  );
}

function ChainRing({ delay, size }: { delay: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        border: "2px solid rgba(212,168,67,0.5)",
        boxShadow: "0 0 12px rgba(212,168,67,0.3)",
      }}
      initial={{ scale: 0.3, opacity: 0.9 }}
      animate={{ scale: 4.5, opacity: 0 }}
      transition={{ duration: 1.6, delay, ease: "easeOut", repeat: Infinity, repeatDelay: 1.0 }}
    />
  );
}

function CrossedTiles() {
  return (
    <svg width="64" height="48" viewBox="0 0 64 48" fill="none" aria-hidden="true" className="absolute -bottom-1 opacity-60">
      <defs>
        <linearGradient id="trFace" x1="0" y1="0" x2="32" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8f3ea" />
          <stop offset="100%" stopColor="#e0d8c8" />
        </linearGradient>
      </defs>
      <g transform="rotate(-15, 16, 24)">
        <rect x="0" y="12" width="30" height="15" rx="3" fill="url(#trFace)" stroke="#a08050" strokeWidth="1.2"/>
        <line x1="15" y1="13" x2="15" y2="26" stroke="#a08050" strokeWidth="0.8" opacity="0.6"/>
      </g>
      <g transform="rotate(15, 48, 24)">
        <rect x="34" y="12" width="30" height="15" rx="3" fill="url(#trFace)" stroke="#a08050" strokeWidth="1.2"/>
        <line x1="49" y1="13" x2="49" y2="26" stroke="#a08050" strokeWidth="0.8" opacity="0.6"/>
      </g>
    </svg>
  );
}

export function TrancadoSplash({ show, isMyTeam, winnerTeam, points, myPips }: TrancadoSplashProps) {
  const winColor = winnerTeam !== null ? TEAM_COLORS[winnerTeam] : null;
  const accentColor = winColor?.main ?? "#d4a843";
  const accentGlow = winColor?.glow ?? "rgba(212,168,67,0.7)";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="trancado-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeIn" } }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(0,0,0,0.84)", backdropFilter: "blur(8px)" }}
          role="status"
          aria-live="assertive"
          aria-label={`¡Trancado! ${winnerTeam !== null ? (isMyTeam ? "Tu equipo gana el conteo" : "El equipo contrario gana el conteo") : "Empate"} — ${points} puntos`}
        >
          <motion.div
            initial={{ scale: 0.45, opacity: 0, y: 32 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, y: -20, transition: { duration: 0.4, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.05 }}
            className="relative flex flex-col items-center gap-5"
          >
            {/* Lock icon with chain rings */}
            <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                <ChainRing delay={0} size={70} />
                <ChainRing delay={0.3} size={70} />
                <ChainRing delay={0.6} size={70} />
              </div>
              <motion.div
                className="relative z-10 drop-shadow-2xl flex flex-col items-center"
                animate={{ rotate: [0, -6, 6, -4, 3, 0] }}
                transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 }}
              >
                <LockIcon />
                <CrossedTiles />
              </motion.div>
            </div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.3 }}
              className="flex flex-col items-center gap-1.5"
            >
              <motion.span
                className="text-[48px] sm:text-[64px] font-black uppercase leading-none tracking-tight"
                style={{
                  color: accentColor,
                  textShadow: `0 0 60px ${accentGlow}, 0 0 30px ${accentGlow}, 0 4px 20px rgba(0,0,0,0.9)`,
                }}
                animate={{
                  textShadow: [
                    `0 0 60px ${accentGlow}, 0 0 30px ${accentGlow}, 0 4px 20px rgba(0,0,0,0.9)`,
                    `0 0 90px ${accentGlow}, 0 0 50px ${accentGlow}, 0 4px 20px rgba(0,0,0,0.9)`,
                    `0 0 60px ${accentGlow}, 0 0 30px ${accentGlow}, 0 4px 20px rgba(0,0,0,0.9)`,
                  ],
                }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              >
                ¡Trancado!
              </motion.span>

              <motion.span
                className="text-sm sm:text-base font-semibold uppercase tracking-widest"
                style={{ color: "rgba(245,240,232,0.75)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38 }}
              >
                {winnerTeam !== null
                  ? isMyTeam
                    ? "¡Tu equipo gana el conteo!"
                    : "El rival gana el conteo"
                  : "Empate — nadie anota"}
              </motion.span>
            </motion.div>

            {/* Pip count + points badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 400, damping: 22 }}
              className="flex flex-col items-center gap-2"
            >
              {/* Points badge */}
              {points > 0 && winnerTeam !== null && (
                <div
                  className="flex items-center gap-2 rounded-full px-5 py-2"
                  style={{
                    background: winColor?.bg ?? "rgba(212,168,67,0.12)",
                    border: `1.5px solid ${winColor?.border ?? "rgba(212,168,67,0.45)"}`,
                    boxShadow: isMyTeam ? `0 0 20px ${winColor?.bg ?? "rgba(212,168,67,0.2)"}` : undefined,
                  }}
                >
                  <motion.span
                    className="text-[26px] sm:text-[32px] font-black tabular-nums leading-none"
                    style={{
                      color: accentColor,
                      textShadow: `0 0 20px ${accentGlow}`,
                    }}
                    animate={isMyTeam ? { scale: [1, 1.06, 1] } : {}}
                    transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                  >
                    +{points}
                  </motion.span>
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest leading-none"
                    style={{ color: `${accentColor}99` }}
                  >
                    pts
                  </span>
                </div>
              )}

              {/* My pip count hint */}
              {myPips !== undefined && myPips > 0 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "rgba(245,240,232,0.45)" }}
                >
                  tus fichas: {myPips} puntos
                </motion.span>
              )}
            </motion.div>

            {/* Radial glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none -z-10"
              style={{
                background: `radial-gradient(ellipse 65% 55% at 50% 50%, ${winColor?.bg ?? "rgba(212,168,67,0.15)"} 0%, transparent 70%)`,
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
