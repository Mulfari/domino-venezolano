"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

/**
 * Shows a 4-pip tension meter when consecutive passes are happening.
 * Appears at 1+ passes, escalates color from amber → orange → red.
 * Disappears when a tile is played (passes reset to 0).
 */
export function PassMeter() {
  const consecutivePasses = useGameStore((s) => s.consecutivePasses);
  const status = useGameStore((s) => s.status);

  if (status !== "playing" || consecutivePasses === 0) return null;

  // Color escalation: 1=amber, 2=orange, 3=red, 4=deep red (trancado)
  const colors = [
    null,
    { pip: "#c9a84c", glow: "rgba(201,168,76,0.6)", label: "#c9a84c", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.4)" },
    { pip: "#e8843a", glow: "rgba(232,132,58,0.65)", label: "#e8843a", bg: "rgba(232,132,58,0.12)", border: "rgba(232,132,58,0.45)" },
    { pip: "#e84a3a", glow: "rgba(232,74,58,0.7)",  label: "#e84a3a", bg: "rgba(232,74,58,0.14)",  border: "rgba(232,74,58,0.5)"  },
    { pip: "#c0392b", glow: "rgba(192,57,43,0.8)",  label: "#c0392b", bg: "rgba(192,57,43,0.18)",  border: "rgba(192,57,43,0.6)"  },
  ] as const;

  const c = colors[Math.min(consecutivePasses, 4) as 1 | 2 | 3 | 4];
  const isCritical = consecutivePasses >= 3;
  const isTrancado = consecutivePasses >= 4;

  return (
    <AnimatePresence>
      <motion.div
        key={`pass-meter-${consecutivePasses}`}
        initial={{ opacity: 0, scale: 0.8, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: -4 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="flex flex-col items-center gap-1 pointer-events-none select-none"
        role="status"
        aria-live="polite"
        aria-label={`${consecutivePasses} pases consecutivos${isTrancado ? ", juego trancado" : ""}`}
      >
        {/* Label */}
        <motion.span
          className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold leading-none"
          style={{ color: c.label, textShadow: `0 0 8px ${c.glow}` }}
          animate={isCritical ? { opacity: [1, 0.55, 1] } : {}}
          transition={isCritical ? { duration: 0.85, repeat: Infinity, ease: "easeInOut" } : {}}
        >
          {isTrancado ? "¡Trancado!" : "Pasos"}
        </motion.span>

        {/* 4-pip domino-style meter */}
        <div
          className="flex items-center gap-1 rounded-full px-2.5 py-1.5"
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            boxShadow: isCritical ? `0 0 12px ${c.glow}` : undefined,
          }}
        >
          {[1, 2, 3, 4].map((pip) => {
            const filled = pip <= consecutivePasses;
            return (
              <motion.div
                key={pip}
                initial={filled ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.04 * pip }}
                className="rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: filled ? c.pip : "rgba(255,255,255,0.08)",
                  border: filled ? "none" : "1px solid rgba(255,255,255,0.12)",
                  boxShadow: filled && isCritical ? `0 0 6px ${c.glow}` : undefined,
                }}
                aria-hidden="true"
              />
            );
          })}
        </div>

        {/* Sublabel: how many until trancado */}
        {!isTrancado && (
          <span
            className="text-[7px] sm:text-[8px] tabular-nums leading-none"
            style={{ color: `${c.label}80` }}
          >
            {4 - consecutivePasses} para trancado
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
