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
          initial={{ opacity: 0, scale: 0.3, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: 0.75,
            y: -28,
            transition: { duration: 0.45, ease: "easeIn" },
          }}
          transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
        >
          <div className="flex items-center gap-1.5 rounded-full bg-[#120900]/95 border border-[#c9a84c]/90 px-3 py-1.5 shadow-2xl backdrop-blur-sm"
            style={{ boxShadow: "0 0 16px 2px rgba(201,168,76,0.25), 0 4px 12px rgba(0,0,0,0.6)" }}
          >
            {/* Skip / X icon */}
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <circle cx="7.5" cy="7.5" r="6.8" stroke="#c9a84c" strokeWidth="1.3" />
              <line x1="4.8" y1="4.8" x2="10.2" y2="10.2" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" />
              <line x1="10.2" y1="4.8" x2="4.8" y2="10.2" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] sm:text-[13px] font-bold text-[#c9a84c] uppercase tracking-widest leading-none">
              Paso
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
