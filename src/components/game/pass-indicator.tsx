"use client";

import { motion, AnimatePresence } from "framer-motion";

interface PassIndicatorProps {
  show: boolean;
}

export function PassIndicator({ show }: PassIndicatorProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -6 }}
          transition={{ duration: 0.25, ease: "backOut" }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        >
          <div className="flex items-center gap-1 rounded-full bg-[#1a0e00]/90 border border-[#c9a84c]/70 px-2 py-1 shadow-lg backdrop-blur-sm">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <circle cx="5.5" cy="5.5" r="5" stroke="#c9a84c" strokeWidth="1" />
              <line x1="3.2" y1="3.2" x2="7.8" y2="7.8" stroke="#c9a84c" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="7.8" y1="3.2" x2="3.2" y2="7.8" stroke="#c9a84c" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#c9a84c] uppercase tracking-widest leading-none">
              Paso
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
