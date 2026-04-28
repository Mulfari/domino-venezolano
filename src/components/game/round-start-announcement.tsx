"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

export function RoundStartAnnouncement() {
  const round = useGameStore((s) => s.round);
  const players = useGameStore((s) => s.players);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const status = useGameStore((s) => s.status);
  const mySeat = useGameStore((s) => s.mySeat);
  const [visible, setVisible] = useState(false);
  const [shownRound, setShownRound] = useState(-1);

  useEffect(() => {
    if (status === "playing" && round !== shownRound) {
      setShownRound(round);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [status, round, shownRound]);

  const starter = players.find((p) => p.seat === currentTurn);
  const starterName = starter?.displayName ?? `Jugador ${currentTurn + 1}`;
  const isMe = mySeat === currentTurn;
  const isFirstRound = round === 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="rounded-2xl bg-[#163d28] border border-[#c9a84c]/40 p-6 sm:p-8 max-w-xs text-center space-y-3 shadow-2xl"
          >
            <p className="text-[#a8c4a0] text-xs uppercase tracking-widest">
              Ronda {round}
            </p>

            {isFirstRound ? (
              <>
                <motion.div
                  animate={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-5xl"
                >
                  🁡
                </motion.div>
                <p className="text-[#c9a84c] font-bold text-lg">
                  ¡Sale la cochina!
                </p>
                <p className="text-[#f5f0e8] text-sm">
                  {isMe ? "¡Te toca salir con el doble 6!" : `${starterName} sale con el doble 6`}
                </p>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-4xl"
                >
                  🎲
                </motion.div>
                <p className="text-[#c9a84c] font-bold text-lg">
                  {isMe ? "¡Te toca salir!" : `Sale ${starterName}`}
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
