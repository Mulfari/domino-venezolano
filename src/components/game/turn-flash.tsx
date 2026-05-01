"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

export function TurnFlash() {
  const currentTurn = useGameStore((s) => s.currentTurn);
  const mySeat = useGameStore((s) => s.mySeat);
  const status = useGameStore((s) => s.status);
  const [show, setShow] = useState(false);
  const prevTurnRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "playing" || mySeat === null) return;

    // Only flash when turn arrives at the local player from someone else
    if (currentTurn !== mySeat) {
      prevTurnRef.current = currentTurn;
      return;
    }
    // Skip the very first render (prevTurn not yet set) and self-to-self
    if (prevTurnRef.current === null || prevTurnRef.current === mySeat) {
      prevTurnRef.current = currentTurn;
      return;
    }
    prevTurnRef.current = currentTurn;

    setShow(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentTurn, mySeat, status]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="turn-flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          {/* Radial glow backdrop — doesn't block the board */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 55% 35% at 50% 50%, rgba(0,0,0,0.55) 0%, transparent 100%)",
            }}
          />

          {/* Expanding ring burst */}
          <motion.div
            className="absolute rounded-full border-2 border-[#c9a84c]/60"
            initial={{ width: 80, height: 80, opacity: 0.9 }}
            animate={{ width: 340, height: 340, opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
          />
          <motion.div
            className="absolute rounded-full border border-[#c9a84c]/35"
            initial={{ width: 60, height: 60, opacity: 0.7 }}
            animate={{ width: 260, height: 260, opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.06 }}
          />

          {/* Main text */}
          <motion.div
            className="relative flex flex-col items-center gap-1"
            initial={{ scale: 0.55, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.08, y: -12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
          >
            <motion.span
              className="text-[52px] sm:text-[72px] font-black uppercase tracking-tight leading-none select-none tabular-nums"
              style={{
                color: "#c9a84c",
                textShadow:
                  "0 0 48px rgba(201,168,76,0.95), 0 0 18px rgba(201,168,76,0.7), 0 4px 20px rgba(0,0,0,0.95)",
              }}
              animate={{ opacity: [1, 1, 1, 0] }}
              transition={{ duration: 1.5, times: [0, 0.4, 0.7, 1], ease: "easeInOut" }}
            >
              ¡Tu turno!
            </motion.span>

            {/* Decorative underline */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="h-0.5 w-32 sm:w-44 rounded-full"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.8), transparent)",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
