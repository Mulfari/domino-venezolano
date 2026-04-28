"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

export function TurnIndicator() {
  const currentTurn = useGameStore((s) => s.currentTurn);
  const isMyTurnFn = useGameStore((s) => s.isMyTurn);
  const players = useGameStore((s) => s.players);
  const status = useGameStore((s) => s.status);

  const isMyTurn = isMyTurnFn();

  if (status !== "playing") return null;

  const currentPlayer = players.find((p) => p.seat === currentTurn);
  const displayName = currentPlayer?.displayName ?? `Jugador ${currentTurn + 1}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentTurn}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center justify-center gap-2"
      >
        {/* Pulsing dot */}
        <motion.div
          className={`h-2.5 w-2.5 rounded-full ${
            isMyTurn ? "bg-amber-400" : "bg-slate-500"
          }`}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <span
          className={`text-sm font-semibold ${
            isMyTurn ? "text-amber-400" : "text-slate-400"
          }`}
        >
          {isMyTurn ? "¡Tu turno!" : `Turno de ${displayName}`}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
