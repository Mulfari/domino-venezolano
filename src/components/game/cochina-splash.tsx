"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CochinaSplashProps {
  show: boolean;
  playerName: string;
  isMe: boolean;
}

function RingBurst() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: "rgba(201,168,76,0.7)", width: 100, height: 100 }}
          initial={{ scale: 0.5, opacity: 0.9 }}
          animate={{ scale: 5 + i * 1.4, opacity: 0 }}
          transition={{ duration: 1.6, delay: i * 0.22, ease: "easeOut", repeat: Infinity, repeatDelay: 0.8 }}
        />
      ))}
    </div>
  );
}

function DoubleSixSVG() {
  const pipPositions6: [number, number][] = [
    [14, 10], [26, 10],
    [14, 22], [26, 22],
    [14, 34], [26, 34],
  ];

  return (
    <svg width="120" height="64" viewBox="0 0 120 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cochFace" x1="0" y1="0" x2="120" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fffef9" />
          <stop offset="100%" stopColor="#ede5d0" />
        </linearGradient>
        <radialGradient id="cochSheen" cx="28%" cy="22%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="40%" stopColor="white" stopOpacity="0.12" />
          <stop offset="100%" stopColor="black" stopOpacity="0.18" />
        </radialGradient>
        <radialGradient id="cochPip" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <filter id="cochGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer glow */}
      <rect x={1} y={1} width={118} height={62} rx={9}
        fill="none" stroke="#c9a84c" strokeWidth={3} opacity={0.6} filter="url(#cochGlow)" />
      {/* Face */}
      <rect x={1.5} y={1.5} width={117} height={61} rx={8}
        fill="url(#cochFace)" stroke="#c9a84c" strokeWidth={2} />
      {/* Sheen */}
      <rect x={1.5} y={1.5} width={117} height={61} rx={8}
        fill="url(#cochSheen)" />
      {/* Divider */}
      <line x1={60} y1={5} x2={60} y2={59} stroke="#c9a84c" strokeWidth={1.8} opacity={0.8} />
      {/* Left 6 pips */}
      {pipPositions6.map(([cx, cy], i) => (
        <g key={`l${i}`}>
          <circle cx={cx} cy={cy + 0.8} r={3.8} fill="rgba(0,0,0,0.3)" />
          <circle cx={cx} cy={cy} r={3.8} fill="url(#cochPip)" />
        </g>
      ))}
      {/* Right 6 pips */}
      {pipPositions6.map(([cx, cy], i) => (
        <g key={`r${i}`}>
          <circle cx={cx + 60} cy={cy + 0.8} r={3.8} fill="rgba(0,0,0,0.3)" />
          <circle cx={cx + 60} cy={cy} r={3.8} fill="url(#cochPip)" />
        </g>
      ))}
    </svg>
  );
}

export function CochinaSplash({ show, playerName, isMe }: CochinaSplashProps) {
  const firstName = playerName.split(" ")[0];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="cochina-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeIn" } }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[62] flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(8px)" }}
          role="status"
          aria-live="assertive"
          aria-label={`¡Cochina! ${isMe ? "Tú abriste" : `${firstName} abrió`} el juego con doble seis`}
        >
          <motion.div
            initial={{ scale: 0.45, opacity: 0, y: 32 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, y: -24, transition: { duration: 0.4, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.05 }}
            className="relative flex flex-col items-center gap-5"
          >
            {/* Tile with ring burst */}
            <div className="relative flex items-center justify-center" style={{ width: 160, height: 100 }}>
              <RingBurst />
              <motion.div
                animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                className="relative z-10 drop-shadow-2xl"
              >
                <DoubleSixSVG />
              </motion.div>
            </div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.3 }}
              className="flex flex-col items-center gap-1.5"
            >
              <motion.span
                className="text-[52px] sm:text-[68px] font-black uppercase leading-none tracking-tight"
                style={{
                  color: "#c9a84c",
                  textShadow: "0 0 60px rgba(201,168,76,0.95), 0 0 30px rgba(201,168,76,0.7), 0 4px 20px rgba(0,0,0,0.9)",
                }}
                animate={{
                  textShadow: [
                    "0 0 60px rgba(201,168,76,0.95), 0 0 30px rgba(201,168,76,0.7), 0 4px 20px rgba(0,0,0,0.9)",
                    "0 0 90px rgba(201,168,76,1), 0 0 50px rgba(201,168,76,0.9), 0 4px 20px rgba(0,0,0,0.9)",
                    "0 0 60px rgba(201,168,76,0.95), 0 0 30px rgba(201,168,76,0.7), 0 4px 20px rgba(0,0,0,0.9)",
                  ],
                }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              >
                ¡Cochina!
              </motion.span>

              <motion.span
                className="text-sm sm:text-base font-semibold uppercase tracking-widest"
                style={{ color: "rgba(245,240,232,0.75)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {isMe ? "¡Abriste con doble seis!" : `${firstName} abre con doble seis`}
              </motion.span>
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.48, type: "spring", stiffness: 400, damping: 22 }}
              className="flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{
                background: "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.45)",
              }}
            >
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.7)" }}>
                primera jugada
              </span>
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-black"
                style={{ background: "#c9a84c", color: "#1a0e00" }}
              >
                6
              </span>
            </motion.div>

            {/* Radial glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none -z-10"
              style={{
                background: "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(201,168,76,0.2) 0%, transparent 70%)",
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
