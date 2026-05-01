"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CapicuaSplashProps {
  show: boolean;
  playerName: string;
  isMe: boolean;
  pipValue: number; // the matching pip value on both ends
}

function CapicuaTile({ pip }: { pip: number }) {
  const W = 56;
  const H = 100;
  const half = H / 2;
  const r = 4.5;

  function pipPositions(val: number, yOffset: number): [number, number][] {
    const cx = W / 2;
    const positions: Record<number, [number, number][]> = {
      0: [],
      1: [[cx, yOffset + half / 2]],
      2: [[cx - W * 0.22, yOffset + half * 0.28], [cx + W * 0.22, yOffset + half * 0.72]],
      3: [[cx - W * 0.22, yOffset + half * 0.28], [cx, yOffset + half / 2], [cx + W * 0.22, yOffset + half * 0.72]],
      4: [[cx - W * 0.22, yOffset + half * 0.28], [cx + W * 0.22, yOffset + half * 0.28], [cx - W * 0.22, yOffset + half * 0.72], [cx + W * 0.22, yOffset + half * 0.72]],
      5: [[cx - W * 0.22, yOffset + half * 0.28], [cx + W * 0.22, yOffset + half * 0.28], [cx, yOffset + half / 2], [cx - W * 0.22, yOffset + half * 0.72], [cx + W * 0.22, yOffset + half * 0.72]],
      6: [[cx - W * 0.22, yOffset + half * 0.28], [cx + W * 0.22, yOffset + half * 0.28], [cx - W * 0.22, yOffset + half / 2], [cx + W * 0.22, yOffset + half / 2], [cx - W * 0.22, yOffset + half * 0.72], [cx + W * 0.22, yOffset + half * 0.72]],
    };
    return positions[val] ?? [];
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <linearGradient id="capFace" x1="0" y1="0" x2={W} y2={H} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fdf8ee" />
          <stop offset="100%" stopColor="#ede5d0" />
        </linearGradient>
        <filter id="capGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer glow */}
      <rect x={1} y={1} width={W - 2} height={H - 2} rx={7} fill="none"
        stroke="#c9a84c" strokeWidth={3} opacity={0.5} filter="url(#capGlow)" />
      {/* Face */}
      <rect x={1.5} y={1.5} width={W - 3} height={H - 3} rx={6}
        fill="url(#capFace)" stroke="#c9a84c" strokeWidth={2} />
      {/* Divider */}
      <line x1={6} y1={half} x2={W - 6} y2={half} stroke="#c9a84c" strokeWidth={1.5} />
      {/* Top half pips */}
      {pipPositions(pip, 0).map(([cx, cy], i) => (
        <circle key={`t${i}`} cx={cx} cy={cy} r={r} fill="#1a1a1a" />
      ))}
      {/* Bottom half pips */}
      {pipPositions(pip, half).map(([cx, cy], i) => (
        <circle key={`b${i}`} cx={cx} cy={cy} r={r} fill="#1a1a1a" />
      ))}
    </svg>
  );
}

// Radiating ring burst
function RingBurst() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: "rgba(201,168,76,0.6)", width: 80, height: 80 }}
          initial={{ scale: 0.5, opacity: 0.9 }}
          animate={{ scale: 4 + i * 1.2, opacity: 0 }}
          transition={{ duration: 1.4, delay: i * 0.28, ease: "easeOut", repeat: Infinity, repeatDelay: 1.2 }}
        />
      ))}
    </div>
  );
}

export function CapicuaSplash({ show, playerName, isMe, pipValue }: CapicuaSplashProps) {
  const firstName = playerName.split(" ")[0];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="capicua-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeIn" } }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
          role="status"
          aria-live="assertive"
          aria-label={`¡Capicúa! ${isMe ? "Tú" : firstName} cerró el juego por los dos extremos`}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, y: -20, transition: { duration: 0.4, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
            className="relative flex flex-col items-center gap-5"
          >
            {/* Ring burst behind tile */}
            <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
              <RingBurst />
              <motion.div
                animate={{ rotate: [0, -6, 6, -4, 4, 0] }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
                className="relative z-10 drop-shadow-2xl"
              >
                <CapicuaTile pip={pipValue} />
              </motion.div>
            </div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.3 }}
              className="flex flex-col items-center gap-1"
            >
              <motion.span
                className="text-4xl sm:text-5xl font-black uppercase tracking-widest leading-none"
                style={{
                  color: "#c9a84c",
                  textShadow: "0 0 40px rgba(201,168,76,0.9), 0 0 80px rgba(201,168,76,0.4), 0 2px 8px rgba(0,0,0,0.9)",
                }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              >
                ¡Capicúa!
              </motion.span>

              <motion.span
                className="text-sm sm:text-base font-semibold uppercase tracking-widest"
                style={{ color: "rgba(245,240,232,0.75)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38 }}
              >
                {isMe ? "¡Lo lograste!" : `${firstName} cerró por los dos extremos`}
              </motion.span>
            </motion.div>

            {/* Pip value badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 400, damping: 22 }}
              className="flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{
                background: "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.4)",
              }}
            >
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.7)" }}>
                ambos extremos
              </span>
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-black"
                style={{ background: "#c9a84c", color: "#1a0e00" }}
              >
                {pipValue}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
