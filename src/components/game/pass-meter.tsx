"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

export function PassMeter() {
  const consecutivePasses = useGameStore((s) => s.consecutivePasses);
  const status = useGameStore((s) => s.status);
  const hands = useGameStore((s) => s.hands);
  const mySeat = useGameStore((s) => s.mySeat);
  const players = useGameStore((s) => s.players);

  const myPips = mySeat !== null
    ? (hands[mySeat] ?? []).reduce((sum, [a, b]) => sum + a + b, 0)
    : null;

  const team0Pips = (hands[0] ?? []).reduce((s, [a, b]) => s + a + b, 0)
                 + (hands[2] ?? []).reduce((s, [a, b]) => s + a + b, 0);
  const team1Pips = (hands[1] ?? []).reduce((s, [a, b]) => s + a + b, 0)
                 + (hands[3] ?? []).reduce((s, [a, b]) => s + a + b, 0);
  const myTeam = mySeat !== null ? ((mySeat % 2) as 0 | 1) : null;
  const winningTeam: 0 | 1 | null = team0Pips < team1Pips ? 0 : team1Pips < team0Pips ? 1 : null;

  function teamLabel(team: 0 | 1): string {
    const seats = team === 0 ? [0, 2] : [1, 3];
    const names = seats.map((s) => {
      const p = players.find((pl) => pl.seat === s);
      return p?.displayName.split(" ")[0] ?? `J${s + 1}`;
    });
    return names.join(" & ");
  }

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

        {/* Pip total — shown at 2+ passes so player can judge if a lock benefits them */}
        <AnimatePresence>
          {consecutivePasses >= 2 && myPips !== null && !isTrancado && (
            <motion.div
              key="pip-total"
              initial={{ opacity: 0, scale: 0.7, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: `1px solid ${c.border}`,
              }}
              aria-label={`Tus puntos en mano: ${myPips}`}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                <rect x="0.5" y="0.5" width="8" height="8" rx="1.5" stroke={c.pip} strokeWidth="0.8" fill="none" opacity="0.7"/>
                <circle cx="4.5" cy="4.5" r="1.5" fill={c.pip} opacity="0.8"/>
              </svg>
              <span
                className="text-[8px] font-bold tabular-nums leading-none"
                style={{ color: c.label }}
              >
                {myPips} pts
              </span>
              <span
                className="text-[7px] leading-none"
                style={{ color: `${c.label}60` }}
              >
                tuyos
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trancado team pip comparison — shows when game is locked so players know who wins */}
        <AnimatePresence>
          {isTrancado && (
            <motion.div
              key="trancado-comparison"
              initial={{ opacity: 0, scale: 0.75, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="flex flex-col items-center gap-1.5"
              aria-label={`Juego trancado. Equipo 1: ${team0Pips} puntos. Equipo 2: ${team1Pips} puntos. ${winningTeam === null ? "Empate" : `Gana equipo ${winningTeam + 1}`}`}
            >
              {/* Rule explanation */}
              <span
                className="text-[7px] sm:text-[8px] uppercase tracking-widest leading-none font-semibold text-center"
                style={{ color: "rgba(245,240,232,0.35)" }}
              >
                gana el equipo con menos puntos
              </span>

              {/* Team pip totals side by side */}
              <div className="flex items-center gap-1.5">
                {([0, 1] as const).map((team) => {
                  const pips = team === 0 ? team0Pips : team1Pips;
                  const isMyT = myTeam === team;
                  const isWinning = winningTeam === team;
                  const isTied = winningTeam === null;
                  const accentColor = team === 0 ? "#c9a84c" : "#4ca8c9";
                  const label = teamLabel(team);

                  return (
                    <motion.div
                      key={team}
                      animate={isWinning ? {
                        boxShadow: [
                          `0 0 0px ${accentColor}`,
                          `0 0 14px ${accentColor}80`,
                          `0 0 0px ${accentColor}`,
                        ],
                      } : {}}
                      transition={isWinning ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : {}}
                      className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1"
                      style={{
                        background: isWinning
                          ? `${accentColor}18`
                          : "rgba(0,0,0,0.3)",
                        border: `1px solid ${isWinning ? `${accentColor}60` : "rgba(255,255,255,0.08)"}`,
                        opacity: !isTied && !isWinning ? 0.55 : 1,
                      }}
                    >
                      <span
                        className="text-[7px] uppercase tracking-widest leading-none font-semibold truncate max-w-[52px] text-center"
                        style={{ color: isMyT ? accentColor : "rgba(245,240,232,0.5)" }}
                        title={label}
                      >
                        {isMyT ? "Nosotros" : "Rivales"}
                      </span>
                      <motion.span
                        key={pips}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="text-[16px] sm:text-[18px] font-black tabular-nums leading-none"
                        style={{
                          color: isWinning ? accentColor : "rgba(245,240,232,0.7)",
                          textShadow: isWinning ? `0 0 12px ${accentColor}80` : undefined,
                        }}
                      >
                        {pips}
                      </motion.span>
                      {isWinning && (
                        <motion.span
                          className="text-[7px] font-black uppercase tracking-widest leading-none"
                          style={{ color: accentColor }}
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                        >
                          ¡gana!
                        </motion.span>
                      )}
                      {isTied && (
                        <span
                          className="text-[7px] uppercase tracking-widest leading-none"
                          style={{ color: "rgba(245,240,232,0.35)" }}
                        >
                          empate
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
