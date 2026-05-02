"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { RoundHistoryEntry } from "@/stores/game-store";
import type { MoveLogEntry } from "@/stores/game-store";

const TEAM_COLORS = {
  0: { dot: "#c9a84c", text: "#c9a84c" },
  1: { dot: "#4ca8c9", text: "#4ca8c9" },
} as const;

function MiniDomino({ a, b }: { a: number; b: number }) {
  const W = 30;
  const H = 14;

  function pips(val: number, xOffset: number) {
    const cx = xOffset + 7;
    const positions: [number, number][] = [];
    if (val % 2 === 1) positions.push([cx, 7]);
    if (val >= 2) { positions.push([cx - 3, 4]); positions.push([cx + 3, 10]); }
    if (val >= 4) { positions.push([cx + 3, 4]); positions.push([cx - 3, 10]); }
    if (val === 6) { positions.push([cx - 3, 7]); positions.push([cx + 3, 7]); }
    return positions.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={1.1} fill="#1a1a1a" />
    ));
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="shrink-0">
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="2" fill="#f5f0e8" stroke="rgba(201,168,76,0.5)" strokeWidth="0.8" />
      <line x1={W / 2} y1="1" x2={W / 2} y2={H - 1} stroke="rgba(201,168,76,0.4)" strokeWidth="0.7" />
      {pips(a, 0)}
      {pips(b, W / 2)}
    </svg>
  );
}

function RoundHeader({ roundNum, result, myTeam }: {
  roundNum: number;
  result?: RoundHistoryEntry;
  myTeam: 0 | 1 | null;
}) {
  const isActive = !result;
  const won = result && myTeam !== null && result.winner_team === myTeam;
  const tied = result && result.winner_team === null;

  const reasonLabel =
    result?.reason === "domino" ? "dominó" :
    result?.reason === "locked" ? "trancado" :
    result?.reason === "tied" ? "empate" : "";

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 sticky top-0 z-10"
      style={{
        background: "linear-gradient(180deg, #1e1008 0%, rgba(30,16,8,0.92) 100%)",
        borderBottom: "1px solid rgba(201,168,76,0.12)",
      }}
    >
      <span
        className="text-[9px] font-black uppercase tracking-widest leading-none"
        style={{ color: isActive ? "#c9a84c" : "rgba(168,196,160,0.5)" }}
      >
        Ronda {roundNum}
      </span>

      {isActive && (
        <motion.span
          className="text-[8px] font-semibold uppercase tracking-wider leading-none px-1.5 py-0.5 rounded-full"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            color: "#c9a84c",
            background: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.3)",
          }}
        >
          en curso
        </motion.span>
      )}

      {result && (
        <div className="flex items-center gap-1.5 ml-auto">
          {result.is_capicua && (
            <span
              className="text-[9px] font-black leading-none"
              style={{ color: "#c9a84c", textShadow: "0 0 6px rgba(201,168,76,0.8)" }}
              title="Capicúa"
            >
              ✦
            </span>
          )}
          <span
            className="text-[8px] font-semibold tabular-nums leading-none"
            style={{ color: tied ? "rgba(168,196,160,0.6)" : won ? "#c9a84c" : "rgba(76,168,201,0.8)" }}
          >
            {tied ? "empate" : won ? `+${result.points}` : `-${result.points}`}
          </span>
          <span className="text-[7px] uppercase tracking-wider leading-none" style={{ color: "rgba(168,196,160,0.35)" }}>
            {reasonLabel}
          </span>
        </div>
      )}
    </div>
  );
}

export function MoveLog() {
  const moveLog = useGameStore((s) => s.moveLog);
  const mySeat = useGameStore((s) => s.mySeat);
  const roundHistory = useGameStore((s) => s.roundHistory);
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(moveLog.length);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && moveLog.length !== prevLenRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    prevLenRef.current = moveLog.length;
  }, [moveLog.length, open]);

  const myTeam = mySeat !== null ? ((mySeat % 2) as 0 | 1) : null;

  // Group entries by round, preserving chronological order within each group
  const grouped = moveLog.reduce<Record<number, MoveLogEntry[]>>((acc, entry) => {
    if (!acc[entry.round]) acc[entry.round] = [];
    acc[entry.round].push(entry);
    return acc;
  }, {});
  const rounds = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  return (
    <div className="relative" ref={containerRef}>
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        aria-label={open ? "Cerrar registro de jugadas" : "Ver registro de jugadas"}
        aria-expanded={open}
        className="relative flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors"
        style={{
          background: open ? "rgba(201,168,76,0.15)" : "rgba(58,34,16,0.8)",
          borderColor: open ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)",
          color: open ? "#c9a84c" : "rgba(168,196,160,0.7)",
          minHeight: 36,
        }}
      >
        <svg width="16" height="8" viewBox="0 0 16 8" fill="none" aria-hidden="true">
          <rect x="0.4" y="0.4" width="15.2" height="7.2" rx="1.5" fill="none" stroke="currentColor" strokeWidth="0.9" />
          <line x1="8" y1="0.5" x2="8" y2="7.5" stroke="currentColor" strokeWidth="0.7" />
          <circle cx="4" cy="4" r="1.2" fill="currentColor" />
          <circle cx="12" cy="4" r="1.2" fill="currentColor" />
        </svg>
        <span className="hidden sm:inline">Jugadas</span>
        {moveLog.length > 0 && (
          <span
            className="flex items-center justify-center rounded-full text-[9px] font-black leading-none tabular-nums"
            style={{
              minWidth: 16,
              height: 16,
              paddingInline: 3,
              background: open ? "rgba(201,168,76,0.3)" : "rgba(201,168,76,0.2)",
              color: "#c9a84c",
              border: "1px solid rgba(201,168,76,0.35)",
            }}
          >
            {moveLog.length > 99 ? "99+" : moveLog.length}
          </span>
        )}
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="move-log-panel"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border shadow-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #2a1a08 0%, #1a1008 100%)",
              borderColor: "rgba(201,168,76,0.3)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)",
            }}
            role="region"
            aria-label="Registro de jugadas"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "rgba(201,168,76,0.15)" }}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c]">
                Registro de jugadas
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="text-[#a8c4a0]/40 hover:text-[#a8c4a0]/80 transition-colors text-xs leading-none px-1"
              >
                ✕
              </button>
            </div>

            {/* List grouped by round */}
            <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 300 }}>
              {rounds.length === 0 ? (
                <div className="px-3 py-6 text-center text-[10px] text-[#a8c4a0]/35 italic">
                  Aún no hay jugadas
                </div>
              ) : (
                rounds.map((roundNum) => {
                  const entries = grouped[roundNum];
                  const result = roundHistory.find((r) => r.round === roundNum);
                  return (
                    <div key={roundNum}>
                      <RoundHeader roundNum={roundNum} result={result} myTeam={myTeam} />
                      {entries.map((entry, idx) => {
                        const team = (entry.seat % 2) as 0 | 1;
                        const colors = TEAM_COLORS[team];
                        const isMe = entry.seat === mySeat;
                        const isPass = entry.type === "pass";
                        const firstName = entry.playerName.split(" ")[0];
                        const isNewest = roundNum === rounds[rounds.length - 1] && idx === entries.length - 1;

                        return (
                          <motion.div
                            key={entry.id}
                            initial={isNewest ? { opacity: 0, x: 8 } : false}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-center gap-2 px-3 py-1.5 border-b last:border-b-0"
                            style={{
                              borderColor: "rgba(255,255,255,0.04)",
                              background: isNewest ? "rgba(201,168,76,0.05)" : undefined,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: colors.dot }}
                            />
                            <span
                              className="text-[10px] font-semibold shrink-0 w-16 truncate leading-none"
                              style={{ color: isMe ? colors.text : "rgba(245,240,232,0.75)" }}
                              title={entry.playerName}
                            >
                              {isMe ? "Tú" : firstName}
                            </span>
                            {isPass ? (
                              <span className="text-[9px] text-[#a8c4a0]/45 italic leading-none">
                                pasó
                              </span>
                            ) : entry.tile ? (
                              <div className="flex items-center gap-1.5">
                                <MiniDomino a={entry.tile[0]} b={entry.tile[1]} />
                                {entry.tile[0] === entry.tile[1] && (
                                  <span
                                    className="text-[8px] font-black uppercase tracking-wider leading-none"
                                    style={{ color: colors.dot }}
                                  >
                                    doble
                                  </span>
                                )}
                              </div>
                            ) : null}
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
