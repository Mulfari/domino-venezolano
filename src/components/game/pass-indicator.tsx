"use client";

import { motion, AnimatePresence } from "framer-motion";

interface PassIndicatorProps {
  show: boolean;
  playerName?: string;
}

export function PassIndicator({ show, playerName }: PassIndicatorProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.4, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: 0.8,
            y: -20,
            transition: { duration: 0.4, ease: "easeIn" },
          }}
          transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
        >
          <div className="flex flex-col items-center gap-1">
            <div
              className="flex items-center gap-2 rounded-full bg-[#0d0600]/95 border border-[#c9a84c] px-4 py-2 backdrop-blur-sm"
              style={{
                boxShadow:
                  "0 0 20px 4px rgba(201,168,76,0.35), 0 0 6px 1px rgba(201,168,76,0.2), 0 6px 16px rgba(0,0,0,0.7)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="#c9a84c" strokeWidth="1.4" />
                <line x1="5" y1="5" x2="11" y2="11" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="11" y1="5" x2="5" y2="11" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className="text-[12px] sm:text-[14px] font-bold text-[#c9a84c] uppercase tracking-widest leading-none">
                Paso
              </span>
            </div>
            {playerName && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="text-[10px] sm:text-[11px] text-[#f5f0e8]/70 font-medium truncate max-w-[90px] text-center"
              >
                {playerName}
              </motion.span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
