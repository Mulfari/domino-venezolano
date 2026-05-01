"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Tile } from "@/lib/game/types";

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

// Tiny inline pip renderer for the tracker grid
function MiniTile({ tile, status }: { tile: Tile; status: "played" | "mine" | "unknown" }) {
  const W = 22;
  const H = 40;
  const half = H / 2;
  const pip = 2.2;

  const faceColor =
    status === "played" ? "#2a2a2a" :
    status === "mine" ? "#fffbe8" :
    "#f5f0e8";

  const pipColor =
    status === "played" ? "#555" :
    status === "mine" ? "#c9a84c" :
    "#1a1a1a";

  const borderColor =
    status === "played" ? "rgba(255,255,255,0.08)" :
    status === "mine" ? "#c9a84c" :
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
    </svg>
  );
}

export function TileTracker() {
  const [open, setOpen] = useState(false);
  const board = useGameStore((s) => s.board);
  const hands = useGameStore((s) => s.hands);
  const mySeat = useGameStore((s) => s.mySeat);
  const status = useGameStore((s) => s.status);

  if (status !== "playing") return null;

  const playedTiles = board.plays.map((p) => p.tile);
  const myHand = mySeat !== null ? (hands[mySeat] ?? []) : [];

  function getStatus(tile: Tile): "played" | "mine" | "unknown" {
    if (playedTiles.some((p) => tilesMatch(p, tile))) return "played";
    if (myHand.some((t) => tilesMatch(t, tile))) return "mine";
    return "unknown";
  }

  const playedCount = ALL_TILES.filter((t) => getStatus(t) === "played").length;
  const unknownCount = ALL_TILES.filter((t) => getStatus(t) === "unknown").length;

  // Group by higher value (0s row, 1s row, ..., 6s row)
  const rows: Tile[][] = Array.from({ length: 7 }, (_, i) =>
    ALL_TILES.filter((t) => t[1] === i)
  );

  return (
    <>
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#c9a84c]">
                  Fichas
                </span>
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#f5f0e8", opacity: 0.9 }} />
                    <span className="text-[#a8c4a0]/60">pendiente</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#c9a84c" }} />
                    <span className="text-[#a8c4a0]/60">tuya</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#2a2a2a", opacity: 0.5 }} />
                    <span className="text-[#a8c4a0]/60">jugada</span>
                  </span>
                </div>
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
                        return (
                          <div key={tileKey(tile)} title={`${tile[0]}-${tile[1]}: ${s === "played" ? "jugada" : s === "mine" ? "en tu mano" : "desconocida"}`}>
                            <MiniTile tile={tile} status={s} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer stats */}
              <div className="mt-3 pt-2.5 flex items-center justify-between" style={{ borderTop: "1px solid rgba(201,168,76,0.12)" }}>
                <span className="text-[9px] text-[#a8c4a0]/50 uppercase tracking-widest">
                  {playedCount} jugadas · {myHand.length} en mano · {unknownCount} ocultas
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[9px] text-[#a8c4a0]/40 hover:text-[#a8c4a0]/80 transition-colors uppercase tracking-widest"
                >
                  cerrar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
