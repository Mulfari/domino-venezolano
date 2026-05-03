"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EMOJIS = ["🔥", "👏", "😮", "🤔", "😅", "💪", "😂", "🎯"];

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number; // percent 10–90
  playerName: string;
  isMe: boolean;
  teamColor: string;
}

interface EmojiReactionsProps {
  mySeat: number | null;
  players: { seat: number; displayName: string }[];
  onSend: (emoji: string) => void;
  incoming: { id: string; seat: number; emoji: string } | null;
}

const TEAM_COLORS: Record<0 | 1, string> = {
  0: "#c9a84c",
  1: "#4ca8c9",
};

export function EmojiReactions({ mySeat, players, onSend, incoming }: EmojiReactionsProps) {
  const [open, setOpen] = useState(false);
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const [cooldown, setCooldown] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());

  // Close picker when clicking outside
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

  // Handle incoming reactions
  useEffect(() => {
    if (!incoming) return;
    if (seenIds.current.has(incoming.id)) return;
    seenIds.current.add(incoming.id);

    const player = players.find((p) => p.seat === incoming.seat);
    const name = player?.displayName.split(" ")[0] ?? `J${incoming.seat + 1}`;
    const isMe = incoming.seat === mySeat;
    const team = (incoming.seat % 2) as 0 | 1;

    const particle: FloatingEmoji = {
      id: incoming.id,
      emoji: incoming.emoji,
      x: 15 + Math.random() * 70,
      playerName: isMe ? "Tú" : name,
      isMe,
      teamColor: TEAM_COLORS[team],
    };

    setFloating((prev) => [...prev, particle]);
    setTimeout(() => {
      setFloating((prev) => prev.filter((p) => p.id !== particle.id));
    }, 2800);
  }, [incoming, mySeat, players]);

  function handleSend(emoji: string) {
    if (cooldown) return;
    onSend(emoji);
    setOpen(false);
    setCooldown(true);
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    cooldownRef.current = setTimeout(() => setCooldown(false), 2500);
  }

  return (
    <>
      {/* Floating emoji particles — rendered over the board */}
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden" aria-hidden="true">
        <AnimatePresence>
          {floating.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: "75vh", scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: "10vh", scale: [0.5, 1.2, 1, 0.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.6, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
              className="absolute flex flex-col items-center gap-1"
              style={{ left: `${p.x}%`, bottom: "15%" }}
            >
              <span className="text-3xl sm:text-4xl drop-shadow-lg select-none">{p.emoji}</span>
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 24 }}
                className="text-[9px] font-bold uppercase tracking-widest leading-none px-1.5 py-0.5 rounded-full"
                style={{
                  color: p.teamColor,
                  background: "rgba(0,0,0,0.55)",
                  border: `1px solid ${p.teamColor}55`,
                  backdropFilter: "blur(4px)",
                }}
              >
                {p.playerName}
              </motion.span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Emoji picker button */}
      <div ref={containerRef} className="relative">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen((v) => !v)}
          disabled={cooldown}
          aria-label={open ? "Cerrar reacciones" : "Enviar reacción"}
          aria-expanded={open}
          className="flex items-center justify-center rounded-lg border transition-colors"
          style={{
            width: 36,
            height: 36,
            background: open ? "rgba(201,168,76,0.18)" : "rgba(58,34,16,0.8)",
            borderColor: open ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)",
            opacity: cooldown ? 0.45 : 1,
            cursor: cooldown ? "not-allowed" : "pointer",
          }}
        >
          <span className="text-base leading-none select-none" aria-hidden="true">😊</span>
        </motion.button>

        {/* Picker popover */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="emoji-picker"
              initial={{ opacity: 0, scale: 0.88, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: -4 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className="absolute right-0 top-full mt-1.5 z-50 rounded-xl border p-2 shadow-2xl"
              style={{
                background: "linear-gradient(160deg, #2a1a08 0%, #1a1008 100%)",
                borderColor: "rgba(201,168,76,0.3)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)",
              }}
              role="dialog"
              aria-label="Seleccionar reacción"
            >
              <div className="grid grid-cols-4 gap-1">
                {EMOJIS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.25 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSend(emoji)}
                    className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                    aria-label={`Reacción ${emoji}`}
                  >
                    <span className="text-xl leading-none select-none">{emoji}</span>
                  </motion.button>
                ))}
              </div>
              <p className="text-center text-[8px] uppercase tracking-widest mt-1.5" style={{ color: "rgba(168,196,160,0.35)" }}>
                todos verán tu reacción
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
