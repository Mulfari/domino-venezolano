"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Seat } from "@/lib/game/types";

interface DisconnectInfo {
  seat: Seat;
  name: string;
  team: 0 | 1;
  isBlockingTurn: boolean;
  disconnectedAt: number;
}

interface ReconnectToast {
  id: string;
  name: string;
  team: 0 | 1;
}

const TEAM_COLORS = {
  0: { accent: "#c9a84c", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.4)", glow: "rgba(201,168,76,0.3)" },
  1: { accent: "#4ca8c9", bg: "rgba(76,168,201,0.12)", border: "rgba(76,168,201,0.4)", glow: "rgba(76,168,201,0.3)" },
};

function ElapsedTimer({ since }: { since: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(Math.floor((Date.now() - since) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - since) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [since]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const display = mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
  const isLong = elapsed >= 30;

  return (
    <motion.span
      className="text-[10px] tabular-nums font-semibold"
      style={{ color: isLong ? "#ef4444" : "rgba(245,240,232,0.45)" }}
      animate={isLong ? { opacity: [1, 0.5, 1] } : {}}
      transition={isLong ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : {}}
    >
      {display}
    </motion.span>
  );
}

export function DisconnectOverlay() {
  const players = useGameStore((s) => s.players);
  const status = useGameStore((s) => s.status);
  const mySeat = useGameStore((s) => s.mySeat);
  const currentTurn = useGameStore((s) => s.currentTurn);

  const [disconnectTimes, setDisconnectTimes] = useState<Record<number, number>>({});
  const [reconnectToasts, setReconnectToasts] = useState<ReconnectToast[]>([]);
  const prevDisconnectedRef = useRef<Set<Seat>>(new Set());
  const toastIdRef = useRef(0);

  const isPlaying = status === "playing";

  const disconnected: DisconnectInfo[] = isPlaying
    ? players
        .filter((p) => !p.connected && p.seat !== mySeat && !p.isBot)
        .map((p) => ({
          seat: p.seat as Seat,
          name: p.displayName.split(" ")[0],
          team: (p.seat % 2) as 0 | 1,
          isBlockingTurn: p.seat === currentTurn,
          disconnectedAt: disconnectTimes[p.seat] ?? Date.now(),
        }))
    : [];

  useEffect(() => {
    if (!isPlaying) return;

    const currentDisconnected = new Set<Seat>(
      players
        .filter((p) => !p.connected && p.seat !== mySeat && !p.isBot)
        .map((p) => p.seat as Seat)
    );

    // Track new disconnections
    for (const seat of currentDisconnected) {
      if (!prevDisconnectedRef.current.has(seat)) {
        setDisconnectTimes((prev) => ({ ...prev, [seat]: Date.now() }));
      }
    }

    // Detect reconnections
    for (const seat of prevDisconnectedRef.current) {
      if (!currentDisconnected.has(seat)) {
        const player = players.find((p) => p.seat === seat);
        if (player) {
          const id = `reconnect-${++toastIdRef.current}`;
          const toast: ReconnectToast = {
            id,
            name: player.displayName.split(" ")[0],
            team: (player.seat % 2) as 0 | 1,
          };
          setReconnectToasts((prev) => [...prev, toast]);
          setTimeout(() => {
            setReconnectToasts((prev) => prev.filter((t) => t.id !== id));
          }, 3000);
        }
        setDisconnectTimes((prev) => {
          const next = { ...prev };
          delete next[seat];
          return next;
        });
      }
    }

    prevDisconnectedRef.current = currentDisconnected;
  }, [players, mySeat, isPlaying]);

  const hasBlockingTurn = disconnected.some((d) => d.isBlockingTurn);

  return (
    <>
      {/* Disconnect banner */}
      <AnimatePresence>
        {disconnected.length > 0 && (
          <motion.div
            key="disconnect-banner"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            role="alert"
            aria-live="assertive"
            className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-[92vw]"
          >
            <div
              className="rounded-xl backdrop-blur-md overflow-hidden"
              style={{
                background: hasBlockingTurn
                  ? "linear-gradient(135deg, rgba(60,10,10,0.92) 0%, rgba(40,5,5,0.95) 100%)"
                  : "linear-gradient(135deg, rgba(22,61,40,0.92) 0%, rgba(14,40,26,0.95) 100%)",
                border: `1.5px solid ${hasBlockingTurn ? "rgba(239,68,68,0.45)" : "rgba(201,168,76,0.3)"}`,
                boxShadow: hasBlockingTurn
                  ? "0 8px 32px rgba(239,68,68,0.2), 0 2px 8px rgba(0,0,0,0.6)"
                  : "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-2 px-3 py-1.5"
                style={{
                  borderBottom: `1px solid ${hasBlockingTurn ? "rgba(239,68,68,0.15)" : "rgba(201,168,76,0.1)"}`,
                  background: hasBlockingTurn ? "rgba(239,68,68,0.06)" : "rgba(201,168,76,0.04)",
                }}
              >
                <div className="flex items-center gap-1" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: hasBlockingTurn ? "#ef4444" : "#c9a84c" }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                    />
                  ))}
                </div>
                <span
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: hasBlockingTurn ? "#ef4444" : "#c9a84c" }}
                >
                  {hasBlockingTurn ? "Esperando reconexión" : "Jugador desconectado"}
                </span>
              </div>

              {/* Player entries */}
              <div className="flex flex-col gap-1 px-3 py-2">
                {disconnected.map((d) => {
                  const tc = TEAM_COLORS[d.team];
                  return (
                    <div key={d.seat} className="flex items-center gap-2">
                      {/* Team dot */}
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: tc.accent,
                          boxShadow: `0 0 6px ${tc.glow}`,
                        }}
                      />
                      {/* Name */}
                      <span
                        className="text-[11px] font-semibold truncate"
                        style={{ color: tc.accent, maxWidth: 100 }}
                      >
                        {d.name}
                      </span>
                      {/* Role badge */}
                      <span
                        className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: tc.bg,
                          border: `1px solid ${tc.border}`,
                          color: tc.accent,
                        }}
                      >
                        {mySeat !== null && ((mySeat + 2) % 4) === d.seat ? "aliado" : "rival"}
                      </span>
                      {/* Blocking turn indicator */}
                      {d.isBlockingTurn && (
                        <motion.span
                          className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                          style={{
                            background: "rgba(239,68,68,0.15)",
                            border: "1px solid rgba(239,68,68,0.4)",
                            color: "#ef4444",
                          }}
                          animate={{ opacity: [1, 0.6, 1] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          su turno
                        </motion.span>
                      )}
                      {/* Elapsed timer */}
                      <div className="ml-auto shrink-0">
                        <ElapsedTimer since={d.disconnectedAt} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reconnection toasts */}
      <AnimatePresence>
        {reconnectToasts.map((toast, i) => {
          const tc = TEAM_COLORS[toast.team];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              className="fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none"
              style={{ top: `${72 + i * 44}px` }}
              role="status"
              aria-live="polite"
            >
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2 backdrop-blur-md"
                style={{
                  background: "linear-gradient(135deg, rgba(22,61,40,0.92) 0%, rgba(14,40,26,0.95) 100%)",
                  border: `1.5px solid rgba(56,220,160,0.4)`,
                  boxShadow: "0 4px 20px rgba(56,220,160,0.15), 0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                <motion.span
                  className="text-[12px]"
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 }}
                  aria-hidden="true"
                >
                  ✓
                </motion.span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: tc.accent }}
                >
                  {toast.name}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "rgba(56,220,160,0.85)" }}
                >
                  reconectado
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </>
  );
}
