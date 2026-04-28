"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

export function DisconnectOverlay() {
  const players = useGameStore((s) => s.players);
  const status = useGameStore((s) => s.status);
  const mySeat = useGameStore((s) => s.mySeat);
  const currentTurn = useGameStore((s) => s.currentTurn);

  if (status !== "playing") return null;

  const disconnected = players.filter(
    (p) => !p.connected && p.seat !== mySeat && !p.isBot
  );

  if (disconnected.length === 0) return null;

  const names = disconnected.map((p) => p.displayName).join(", ");
  const isBlockingTurn = disconnected.some((p) => p.seat === currentTurn);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-16 left-1/2 -translate-x-1/2 z-40 rounded-xl border px-4 py-2.5 shadow-lg flex items-center gap-3 max-w-[90vw] ${
          isBlockingTurn
            ? "bg-red-950/90 border-red-800/50"
            : "bg-[#163d28]/90 border-[#c9a84c]/30"
        } backdrop-blur-sm`}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse [animation-delay:300ms]" />
        </div>
        <p className="text-xs text-[#f5f0e8]">
          <span className="font-semibold">{names}</span>
          {" "}{disconnected.length === 1 ? "desconectado" : "desconectados"}
          {isBlockingTurn && " — esperando su turno"}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
