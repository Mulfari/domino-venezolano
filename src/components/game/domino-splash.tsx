"use client";

import { motion, AnimatePresence } from "framer-motion";

interface DominoSplashProps {
  show: boolean;
  playerName: string;
  isMyTeam: boolean;
}

export function DominoSplash({ show, playerName, isMyTeam }: DominoSplashProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="domino-splash"
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
            {/* Domino tile graphic */}
            <motion.svg
              width="72" height="128" viewBox="0 0 72 128" fill="none"
              aria-hidden="true"
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            >
              {/* Tile body */}
              <rect x="2" y="2" width="68" height="124" rx="8"
                fill="url(#splashFace)" stroke="#c9a84c" strokeWidth="2.5"
              />
              {/* Divider */}
              <line x1="8" y1="64" x2="64" y2="64" stroke="#c9a84c" strokeWidth="1.5" opacity="0.7" />
              {/* Top half: 6 pips */}
              <circle cx="20" cy="22" r="5" fill="#1a1a1a" />
              <circle cx="36" cy="22" r="5" fill="#1a1a1a" />
              <circle cx="52" cy="22" r="5" fill="#1a1a1a" />
              <circle cx="20" cy="42" r="5" fill="#1a1a1a" />
              <circle cx="36" cy="42" r="5" fill="#1a1a1a" />
              <circle cx="52" cy="42" r="5" fill="#1a1a1a" />
              {/* Bottom half: 6 pips */}
              <circle cx="20" cy="86" r="5" fill="#1a1a1a" />
              <circle cx="36" cy="86" r="5" fill="#1a1a1a" />
              <circle cx="52" cy="86" r="5" fill="#1a1a1a" />
              <circle cx="20" cy="106" r="5" fill="#1a1a1a" />
              <circle cx="36" cy="106" r="5" fill="#1a1a1a" />
              <circle cx="52" cy="106" r="5" fill="#1a1a1a" />
              <defs>
                <linearGradient id="splashFace" x1="0" y1="0" x2="72" y2="128" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f8f3ea" />
                  <stop offset="100%" stopColor="#e8e0d0" />
                </linearGradient>
              </defs>
            </motion.svg>

            {/* ¡DOMINÓ! text */}
            <motion.div
              className="flex flex-col items-center gap-1.5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.3 }}
            >
              <motion.span
                className="text-[52px] sm:text-[68px] font-black uppercase leading-none tracking-tight"
                style={{
                  color: isMyTeam ? "#c9a84c" : "#f5f0e8",
                  textShadow: isMyTeam
                    ? "0 0 60px rgba(201,168,76,0.9), 0 0 30px rgba(201,168,76,0.7), 0 4px 20px rgba(0,0,0,0.8)"
                    : "0 0 40px rgba(245,240,232,0.5), 0 4px 20px rgba(0,0,0,0.8)",
                }}
                animate={isMyTeam ? {
                  textShadow: [
                    "0 0 60px rgba(201,168,76,0.9), 0 0 30px rgba(201,168,76,0.7), 0 4px 20px rgba(0,0,0,0.8)",
                    "0 0 90px rgba(201,168,76,1), 0 0 50px rgba(201,168,76,0.9), 0 4px 20px rgba(0,0,0,0.8)",
                    "0 0 60px rgba(201,168,76,0.9), 0 0 30px rgba(201,168,76,0.7), 0 4px 20px rgba(0,0,0,0.8)",
                  ],
                } : {}}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              >
                ¡Dominó!
              </motion.span>

              <motion.span
                className="text-[15px] sm:text-[18px] font-semibold tracking-widest uppercase"
                style={{
                  color: isMyTeam ? "rgba(201,168,76,0.85)" : "rgba(245,240,232,0.65)",
                  textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38, duration: 0.25 }}
              >
                {playerName}
              </motion.span>
            </motion.div>

            {/* Radial glow behind everything */}
            <motion.div
              className="absolute inset-0 pointer-events-none -z-10"
              style={{
                background: isMyTeam
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
