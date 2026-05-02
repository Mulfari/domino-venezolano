"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

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

export function MoveLog() {
  const moveLog = useGameStore((s) => s.moveLog);
  const mySeat = useGameStore((s) => s.mySeat);
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

  // Auto-scroll to bottom when new entries arrive while open
  useEffect(() => {
    if (open && moveLog.length !== prevLenRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    prevLenRef.current = moveLog.length;
  }, [moveLog.length, open]);

  const recentCount = moveLog.length;

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
        {/* Domino icon */}
        <svg width="16" height="8" viewBox="0 0 16 8" fill="none" aria-hidden="true">
          <rect x="0.4" y="0.4" width="15.2" height="7.2" rx="1.5" fill="none" stroke="currentColor" strokeWidth="0.9" />
          <line x1="8" y1="0.5" x2="8" y2="7.5" stroke="currentColor" strokeWidth="0.7" />
          <circle cx="4" cy="4" r="1.2" fill="currentColor" />
          <circle cx="12" cy="4" r="1.2" fill="currentColor" />
        </svg>
        <span className="hidden sm:inline">Jugadas</span>
        {recentCount > 0 && (
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
            {recentCount > 99 ? "99+" : recentCount}
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

            {/* List */}
            <div
              ref={listRef}
              className="overflow-y-auto"
              style={{ maxHeight: 260 }}
            >
              {moveLog.length === 0 ? (
                <div className="px-3 py-6 text-center text-[10px] text-[#a8c4a0]/35 italic">
                  Aún no hay jugadas
                </div>
              ) : (
                <div className="flex flex-col-reverse">
                  {[...moveLog].reverse().map((entry, idx) => {
                    const team = (entry.seat % 2) as 0 | 1;
                    const colors = TEAM_COLORS[team];
                    const isMe = entry.seat === mySeat;
                    const isPass = entry.type === "pass";
                    const firstName = entry.playerName.split(" ")[0];

                    return (
                      <motion.div
                        key={entry.id}
                        initial={idx === 0 ? { opacity: 0, x: 8 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center gap-2 px-3 py-1.5 border-b last:border-b-0"
                        style={{
                          borderColor: "rgba(255,255,255,0.04)",
                          background: idx === 0 ? "rgba(201,168,76,0.05)" : undefined,
                        }}
                      >
                        {/* Team dot */}
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: colors.dot }}
                        />

                        {/* Player name */}
                        <span
                          className="text-[10px] font-semibold shrink-0 w-16 truncate leading-none"
                          style={{ color: isMe ? colors.text : "rgba(245,240,232,0.75)" }}
                          title={entry.playerName}
                        >
                          {isMe ? "Tú" : firstName}
                        </span>

                        {/* Action */}
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

                        {/* Round badge — only show when round changes */}
                        <span className="ml-auto text-[8px] tabular-nums text-[#a8c4a0]/25 shrink-0">
                          R{entry.round}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
