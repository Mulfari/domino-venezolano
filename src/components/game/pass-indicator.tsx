"use client";

import { motion, AnimatePresence } from "framer-motion";

interface PassIndicatorProps {
  show: boolean;
  playerName?: string;
}

export function PassIndicator({ show, playerName }: PassIndicatorProps) {
  return (
    <>
      {/* Persistent live region — must stay in DOM so screen readers catch content changes */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {show ? (playerName ? `${playerName} pasó su turno` : "Turno pasado") : ""}
      </div>
      <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: 0.9,
            y: -28,
            transition: { duration: 0.45, ease: "easeIn" },
          }}
          transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex flex-col items-center gap-1.5"
        >
          <div
            className="flex items-center gap-2 rounded-full bg-[#0d0600]/97 border-2 border-[#c9a84c] px-4 py-2.5 backdrop-blur-sm whitespace-nowrap"
            style={{
              boxShadow:
                "0 0 28px 8px rgba(201,168,76,0.45), 0 0 10px 2px rgba(201,168,76,0.3), 0 8px 24px rgba(0,0,0,0.85)",
            }}
          >
            {/* Skip / X icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="7.5" stroke="#c9a84c" strokeWidth="1.5" />
              <line x1="5.5" y1="5.5" x2="12.5" y2="12.5" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
              <line x1="12.5" y1="5.5" x2="5.5" y2="12.5" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] sm:text-[15px] font-bold text-[#c9a84c] uppercase tracking-widest leading-none">
              Paso
            </span>
          </div>
          {playerName && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.2 }}
              className="text-[11px] sm:text-[12px] text-[#f5f0e8]/85 font-semibold truncate max-w-[110px] text-center"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}
            >
              {playerName}
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
