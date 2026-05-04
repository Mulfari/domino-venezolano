"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Tile, Seat } from "@/lib/game/types";

// All 28 tiles in a standard double-6 set
const ALL_TILES: Tile[] = [];
for (let i = 0; i <= 6; i++) {
  for (let j = i; j <= 6; j++) {
    ALL_TILES.push([i, j]);
  }
}

function tileKey(t: Tile) {
  return `${t[0]}-${t[1]}`;
}

function tilesMatch(a: Tile, b: Tile) {
  return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
}

type TileStatus = "played" | "mine" | "playable" | "unknown";

/** How many opponents (out of 3) are known NOT to hold this tile, based on pass inference. */
type EliminationInfo = { count: number; seats: Seat[] };

// Tiny inline pip renderer for the tracker grid
function MiniTile({ tile, status, elimination }: { tile: Tile; status: TileStatus; elimination?: EliminationInfo }) {
  const W = 22;
  const H = 40;
  const half = H / 2;
  const pip = 2.2;

  const faceColor =
    status === "played"   ? "#2a2a2a" :
    status === "mine"     ? "#fffbe8" :
    status === "playable" ? "#0e2a1e" :
    "#f5f0e8";

  const pipColor =
    status === "played"   ? "#555" :
    status === "mine"     ? "#c9a84c" :
    status === "playable" ? "#38dca0" :
    "#1a1a1a";

  const borderColor =
    status === "played"   ? "rgba(255,255,255,0.08)" :
    status === "mine"     ? "#c9a84c" :
    status === "playable" ? "rgba(56,220,160,0.7)" :
    "rgba(201,168,76,0.25)";

  const opacity = status === "played" ? 0.35 : 1;

  function pips(val: number, yOffset: number) {
    const positions: Record<number, [number, number][]> = {
      0: [],
      1: [[W/2, yOffset + half/2]],
      2: [[W*0.28, yOffset + half*0.28], [W*0.72, yOffset + half*0.72]],
      3: [[W*0.28, yOffset + half*0.28], [W/2, yOffset + half/2], [W*0.72, yOffset + half*0.72]],
      4: [[W*0.28, yOffset + half*0.28], [W*0.72, yOffset + half*0.28], [W*0.28, yOffset + half*0.72], [W*0.72, yOffset + half*0.72]],
      5: [[W*0.28, yOffset + half*0.28], [W*0.72, yOffset + half*0.28], [W/2, yOffset + half/2], [W*0.28, yOffset + half*0.72], [W*0.72, yOffset + half*0.72]],
      6: [[W*0.28, yOffset + half*0.28], [W*0.72, yOffset + half*0.28], [W*0.28, yOffset + half/2], [W*0.72, yOffset + half/2], [W*0.28, yOffset + half*0.72], [W*0.72, yOffset + half*0.72]],
    };
    return (positions[val] ?? []).map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r={pip} fill={pipColor} />
    ));
  }

  const showElim = elimination && elimination.count > 0 && (status === "unknown" || status === "playable");

  return (
    <svg
      width={W} height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ opacity, display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} rx={3} fill={faceColor} stroke={borderColor} strokeWidth={1.2} />
      <line x1={2} y1={half} x2={W - 2} y2={half} stroke={borderColor} strokeWidth={0.8} />
      {pips(tile[0], 0)}
      {pips(tile[1], half)}
      {/* Elimination dots — one per opponent who can't hold this tile */}
      {showElim && (
        <>
          {elimination.count >= 1 && <circle cx={W - 4} cy={H - 4} r={2} fill="#e85454" fillOpacity={0.9} />}
          {elimination.count >= 2 && <circle cx={W - 4} cy={H - 9} r={2} fill="#e85454" fillOpacity={0.9} />}
          {elimination.count >= 3 && <circle cx={W - 4} cy={H - 14} r={2} fill="#e85454" fillOpacity={0.9} />}
        </>
      )}
    </svg>
  );
}

function SuitBar({ pip, playedCount, boardLeft, boardRight }: {
  pip: number;
  playedCount: number;
  boardLeft: number | null;
  boardRight: number | null;
}) {
  const total = 7;
  const pct = (playedCount / total) * 100;
  const isExhausted = playedCount === total;
  const isActive = boardLeft === pip || boardRight === pip;

  const barColor = isExhausted
    ? "rgba(255,255,255,0.1)"
    : isActive
    ? "#38dca0"
    : "rgba(201,168,76,0.55)";

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`Palo ${pip}: ${playedCount} de ${total} jugadas`}
    >
      <span
        className="w-3 text-[8px] font-bold tabular-nums text-right shrink-0"
        style={{
          color: isActive
            ? "#38dca0"
            : isExhausted
            ? "rgba(255,255,255,0.18)"
            : "rgba(201,168,76,0.55)",
        }}
      >
        {pip}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ minWidth: 60, background: "rgba(15,30,20,0.8)" }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ backgroundColor: barColor }}
        />
      </div>
      <span
        className="text-[8px] tabular-nums shrink-0 font-semibold"
        style={{
          minWidth: 22,
          color: isExhausted
            ? "rgba(255,255,255,0.18)"
            : isActive
            ? "#38dca0"
            : "rgba(201,168,76,0.4)",
        }}
      >
        {playedCount}/{total}
      </span>
      {isActive && !isExhausted && (
        <span
          className="text-[7px] shrink-0 leading-none"
          style={{ color: "rgba(56,220,160,0.75)" }}
          aria-hidden="true"
        >
          ●
        </span>
      )}
      {isExhausted && (
        <span
          className="text-[7px] shrink-0 leading-none"
          style={{ color: "rgba(255,255,255,0.2)" }}
          aria-hidden="true"
        >
          ✓
        </span>
      )}
    </div>
  );
}

export function TileTracker() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const board = useGameStore((s) => s.board);
  const hands = useGameStore((s) => s.hands);
  const mySeat = useGameStore((s) => s.mySeat);
  const status = useGameStore((s) => s.status);
  const moveLog = useGameStore((s) => s.moveLog);
  const round = useGameStore((s) => s.round);
  const players = useGameStore((s) => s.players);

  // Close panel when clicking outside the component
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Pass inference: for each opponent, collect which pips they're known to lack
  // When a player passes, they had no tiles matching either board end at that moment
  const passInference = useMemo(() => {
    const missingPips: Record<number, Set<number>> = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set() };
    const currentRoundEntries = moveLog.filter((e) => e.round === round);
    for (const entry of currentRoundEntries) {
      if (entry.type !== "pass") continue;
      if (entry.passedOnLeft != null) missingPips[entry.seat].add(entry.passedOnLeft);
      if (entry.passedOnRight != null && entry.passedOnRight !== entry.passedOnLeft) {
        missingPips[entry.seat].add(entry.passedOnRight);
      }
    }
    return missingPips;
  }, [moveLog, round]);

  // For a given unknown/playable tile, which opponents can't hold it?
  function getElimination(tile: Tile): EliminationInfo {
    if (mySeat === null) return { count: 0, seats: [] };
    const eliminated: Seat[] = [];
    for (let s = 0; s < 4; s++) {
      if (s === mySeat) continue;
      const missing = passInference[s];
      if (missing.size === 0) continue;
      if (!missing.has(tile[0]) && !missing.has(tile[1])) continue;
      eliminated.push(s as Seat);
    }
    return { count: eliminated.length, seats: eliminated };
  }

  if (status !== "playing") return null;

  const playedTiles = board.plays.map((p) => p.tile);
  const myHand = mySeat !== null ? (hands[mySeat] ?? []) : [];
  const boardLeft = board.left;
  const boardRight = board.right;
  const boardHasEnds = boardLeft !== null && boardRight !== null;

  function tileMatchesEnd(tile: Tile): boolean {
    if (!boardHasEnds) return false;
    return tile[0] === boardLeft || tile[1] === boardLeft ||
           tile[0] === boardRight || tile[1] === boardRight;
  }

  function getStatus(tile: Tile): TileStatus {
    if (playedTiles.some((p) => tilesMatch(p, tile))) return "played";
    if (myHand.some((t) => tilesMatch(t, tile))) return "mine";
    if (tileMatchesEnd(tile)) return "playable";
    return "unknown";
  }

  const playedCount = ALL_TILES.filter((t) => getStatus(t) === "played").length;
  const unknownCount = ALL_TILES.filter((t) => getStatus(t) === "unknown").length;
  const playableCount = ALL_TILES.filter((t) => getStatus(t) === "playable").length;

  // Count how many opponents have pass inference data
  const opponentsWithInference = mySeat !== null
    ? ([0, 1, 2, 3] as Seat[]).filter((s) => s !== mySeat && passInference[s].size > 0)
    : [];

  // Group by higher value (0s row, 1s row, ..., 6s row)
  const rows: Tile[][] = Array.from({ length: 7 }, (_, i) =>
    ALL_TILES.filter((t) => t[1] === i)
  );

  // Per-suit: how many of the 7 tiles containing each pip have been played
  const suitPlayedCounts = Array.from({ length: 7 }, (_, pip) =>
    playedTiles.filter((t) => t[0] === pip || t[1] === pip).length
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar rastreador de fichas" : "Ver fichas jugadas"}
        className="relative flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors"
        style={{
          background: open ? "rgba(201,168,76,0.18)" : "rgba(0,0,0,0.25)",
          border: `1px solid ${open ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.08)"}`,
        }}
      >
        {/* Domino icon */}
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="15" height="9" rx="1.5" fill="none" stroke={open ? "#c9a84c" : "#a8c4a0"} strokeWidth="1"/>
          <line x1="8" y1="1" x2="8" y2="9" stroke={open ? "#c9a84c" : "#a8c4a0"} strokeWidth="0.8"/>
          <circle cx="4" cy="5" r="1.2" fill={open ? "#c9a84c" : "#a8c4a0"}/>
          <circle cx="12" cy="5" r="1.2" fill={open ? "#c9a84c" : "#a8c4a0"}/>
        </svg>
        <span className="hidden sm:inline text-[10px] font-semibold" style={{ color: open ? "#c9a84c" : "#a8c4a0" }}>
          {playedCount}/28
        </span>
        {/* Badge showing unknown count */}
        {unknownCount > 0 && !open && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-black leading-none"
            style={{ background: "#c9a84c", color: "#1a0e00" }}
          >
            {unknownCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="tracker-panel"
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50"
            role="dialog"
            aria-label="Rastreador de fichas"
          >
            <div
              className="rounded-2xl p-3 sm:p-4 backdrop-blur-md"
              style={{
                background: "linear-gradient(160deg, #1a1208 0%, #0e0c06 100%)",
                border: "1.5px solid rgba(201,168,76,0.35)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.5)",
                minWidth: 220,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#c9a84c]">
                  Fichas
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[9px] text-[#a8c4a0]/40 hover:text-[#a8c4a0]/80 transition-colors uppercase tracking-widest"
                >
                  cerrar
                </button>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-[9px] uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#f5f0e8", opacity: 0.9 }} />
                  <span className="text-[#a8c4a0]/60">oculta</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#c9a84c" }} />
                  <span className="text-[#a8c4a0]/60">tuya</span>
                </span>
                {boardHasEnds && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#38dca0" }} />
                    <span className="text-[#38dca0]/80">jugable</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#2a2a2a", opacity: 0.5 }} />
                  <span className="text-[#a8c4a0]/60">jugada</span>
                </span>
                {opponentsWithInference.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#e85454" }} />
                    <span style={{ color: "rgba(232,84,84,0.7)" }}>descartada</span>
                  </span>
                )}
              </div>

              {/* Board ends hint */}
              {boardHasEnds && playableCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg"
                  style={{
                    background: "rgba(56,220,160,0.08)",
                    border: "1px solid rgba(56,220,160,0.25)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <circle cx="6" cy="6" r="5" stroke="rgba(56,220,160,0.7)" strokeWidth="1.2"/>
                    <line x1="6" y1="3" x2="6" y2="6.5" stroke="rgba(56,220,160,0.9)" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="6" cy="8.5" r="0.8" fill="rgba(56,220,160,0.9)"/>
                  </svg>
                  <span className="text-[9px] leading-tight" style={{ color: "rgba(56,220,160,0.8)" }}>
                    {playableCount} ficha{playableCount !== 1 ? "s" : ""} oculta{playableCount !== 1 ? "s" : ""} encajan con {boardLeft === boardRight ? `el ${boardLeft}` : `el ${boardLeft} o el ${boardRight}`}
                  </span>
                </motion.div>
              )}

              {/* Suit exhaustion bars */}
              <div className="flex flex-col gap-1 mb-3 pb-2.5" style={{ borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
                <span className="text-[8px] uppercase tracking-wider text-[#a8c4a0]/40 mb-0.5">Palos</span>
                {Array.from({ length: 7 }, (_, pip) => (
                  <SuitBar
                    key={pip}
                    pip={pip}
                    playedCount={suitPlayedCounts[pip]}
                    boardLeft={boardLeft}
                    boardRight={boardRight}
                  />
                ))}
              </div>

              {/* Tile grid — one row per higher value */}
              <div className="flex flex-col gap-1">
                {rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-1">
                    <span
                      className="w-3 text-[8px] font-bold tabular-nums text-right shrink-0"
                      style={{ color: "rgba(201,168,76,0.4)" }}
                    >
                      {rowIdx}
                    </span>
                    <div className="flex gap-1">
                      {row.map((tile) => {
                        const s = getStatus(tile);
                        const elim = (s === "unknown" || s === "playable") ? getElimination(tile) : undefined;
                        const elimLabel = elim && elim.count > 0
                          ? ` — ${elim.count} oponente${elim.count > 1 ? "s" : ""} no la tiene${elim.count > 1 ? "n" : ""}`
                          : "";
                        const statusLabel =
                          s === "played"   ? "jugada" :
                          s === "mine"     ? "en tu mano" :
                          s === "playable" ? "oculta — encaja con el tablero" + elimLabel :
                          "desconocida" + elimLabel;
                        return (
                          <div key={tileKey(tile)} title={`${tile[0]}-${tile[1]}: ${statusLabel}`}>
                            <MiniTile tile={tile} status={s} elimination={elim} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pass inference — opponent missing pips summary */}
              {opponentsWithInference.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-3 pt-2.5" style={{ borderTop: "1px solid rgba(201,168,76,0.12)" }}>
                  <span className="text-[8px] uppercase tracking-wider text-[#a8c4a0]/40 mb-0.5">
                    Deducción por pases
                  </span>
                  {opponentsWithInference.map((seat) => {
                    const player = players.find((p) => p.seat === seat);
                    const name = player ? player.displayName.split(" ")[0] : `J${seat + 1}`;
                    const team = (seat % 2) as 0 | 1;
                    const isPartner = mySeat !== null && ((mySeat + 2) % 4) === seat;
                    const teamColor = team === 0 ? "#c9a84c" : "#4ca8c9";
                    const missingArr = Array.from(passInference[seat]).sort((a, b) => a - b);
                    return (
                      <div
                        key={seat}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg"
                        style={{
                          background: "rgba(232,84,84,0.06)",
                          border: "1px solid rgba(232,84,84,0.15)",
                        }}
                        aria-label={`${name} no tiene palos: ${missingArr.join(", ")}`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: teamColor }}
                        />
                        <span
                          className="text-[9px] font-semibold shrink-0 truncate"
                          style={{ color: teamColor, maxWidth: 60 }}
                        >
                          {name}
                          {isPartner && (
                            <span className="text-[7px] ml-0.5" style={{ color: "rgba(168,196,160,0.5)" }}>
                              ★
                            </span>
                          )}
                        </span>
                        <span className="text-[8px] shrink-0" style={{ color: "rgba(232,84,84,0.6)" }}>
                          sin
                        </span>
                        <div className="flex gap-1">
                          {missingArr.map((p) => (
                            <span
                              key={p}
                              className="flex items-center justify-center w-4 h-4 rounded text-[8px] font-black leading-none"
                              style={{
                                background: "rgba(232,84,84,0.15)",
                                color: "#e85454",
                                border: "1px solid rgba(232,84,84,0.3)",
                              }}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer stats */}
              <div className="mt-3 pt-2.5 flex items-center justify-between" style={{ borderTop: "1px solid rgba(201,168,76,0.12)" }}>
                <span className="text-[9px] text-[#a8c4a0]/50 uppercase tracking-widest">
                  {playedCount} jugadas · {myHand.length} en mano
                  {boardHasEnds && playableCount > 0 ? ` · ${playableCount} jugables` : ` · ${unknownCount} ocultas`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
