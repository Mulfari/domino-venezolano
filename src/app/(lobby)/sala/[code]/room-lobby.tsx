"use client";

import { createClient } from "@/lib/supabase/client";
import { startGame, addBot, removeBot, leaveRoom } from "@/lib/rooms/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Seat = { user_id: string; display_name: string } | null;

interface Room {
  id: string;
  code: string;
  host_id: string;
  status: string;
  seats: Seat[];
  current_game_id: string | null;
}

interface Props {
  room: Room;
  userId: string;
  displayName: string;
}

const seatLabels = ["Sur", "Oeste", "Norte", "Este"];
const teamColors = [
  { bg: "bg-[#f5f0e8]/10", border: "border-[#f5f0e8]/30", text: "text-[#f5f0e8]", label: "Equipo A", dot: "bg-[#f5f0e8]" },
  { bg: "bg-[#c9a84c]/10", border: "border-[#c9a84c]/30", text: "text-[#c9a84c]", label: "Equipo B", dot: "bg-[#c9a84c]" },
  { bg: "bg-[#f5f0e8]/10", border: "border-[#f5f0e8]/30", text: "text-[#f5f0e8]", label: "Equipo A", dot: "bg-[#f5f0e8]" },
  { bg: "bg-[#c9a84c]/10", border: "border-[#c9a84c]/30", text: "text-[#c9a84c]", label: "Equipo B", dot: "bg-[#c9a84c]" },
];

/* ── Spinner ──────────────────────────────────── */
function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ── Copy icon ────────────────────────────────── */
function IconCopy() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-4 h-4 text-[#a8c4a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  );
}

/* ── Seat card ────────────────────────────────── */
function SeatCard({
  seat,
  index,
  isHost,
  isCurrentUser,
  roomHostId,
  onAddBot,
  onRemoveBot,
}: {
  seat: Seat;
  index: number;
  isHost: boolean;
  isCurrentUser: boolean;
  roomHostId: string;
  onAddBot?: () => void;
  onRemoveBot?: () => void;
}) {
  const team = teamColors[index];
  const direction = seatLabels[index];
  const isBot = seat?.user_id?.startsWith("bot_") ?? false;

  if (!seat) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className="glass rounded-2xl border border-dashed border-[#c9a84c]/20 p-5 flex flex-col items-center justify-center gap-3 min-h-[140px] relative overflow-hidden"
      >
        <div className="absolute inset-0 animate-shimmer" />
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-[#1e5c3a]/40 border border-[#c9a84c]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#a8c4a0]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        </div>
        <div className="text-center relative">
          <p className="text-sm text-[#a8c4a0]/60">Esperando...</p>
          <p className="text-xs text-[#a8c4a0]/40 mt-0.5">{direction}</p>
        </div>
        {isHost && onAddBot && (
          <button
            onClick={onAddBot}
            className="relative text-xs text-[#c9a84c] hover:text-[#dfc06a] transition-colors mt-1"
          >
            + Añadir Bot
          </button>
        )}
      </motion.div>
    );
  }

  const isSeatHost = seat.user_id === roomHostId;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
      className={`glass rounded-2xl border ${team.border} p-5 flex flex-col items-center justify-center gap-3 min-h-[140px] relative`}
    >
      {isSeatHost && (
        <div className="absolute top-2.5 right-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 px-2 py-0.5 text-[10px] font-bold text-[#c9a84c] uppercase tracking-wider">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1l2.928 6.856L20 8.59l-5.072 4.578L16.18 20 10 16.42 3.82 20l1.252-6.832L0 8.59l7.072-.734L10 1z" clipRule="evenodd" />
            </svg>
            Host
          </span>
        </div>
      )}
      {isBot && (
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
            🤖 Bot
          </span>
        </div>
      )}

      <div className={`w-12 h-12 rounded-full ${team.bg} border ${team.border} flex items-center justify-center text-lg font-bold ${team.text}`}>
        {isBot ? "🤖" : seat.display_name.charAt(0).toUpperCase()}
      </div>

      <div className="text-center">
        <p className="font-semibold text-[#f5f0e8] text-sm flex items-center gap-1.5 justify-center">
          {seat.display_name}
          {isCurrentUser && (
            <span className="text-[10px] text-[#c9a84c] font-normal">(tú)</span>
          )}
        </p>
        <div className="flex items-center gap-1.5 justify-center mt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${team.dot}`} />
          <p className={`text-xs ${team.text}`}>{team.label} — {direction}</p>
        </div>
      </div>
      {isHost && isBot && onRemoveBot && (
        <button
          onClick={onRemoveBot}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Quitar bot
        </button>
      )}
    </motion.div>
  );
}

/* ── Main component ───────────────────────────── */
export function RoomLobby({ room, userId, displayName }: Props) {
  const [seats, setSeats] = useState<Seat[]>(room.seats);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const isHost = room.host_id === userId;
  const filledCount = seats.filter((s) => s !== null).length;
  const allReady = filledCount === 4;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const updated = payload.new as Room;
          setSeats(updated.seats);
          if (updated.status === "playing" && updated.current_game_id) {
            router.push(`/juego/${updated.current_game_id}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, router]);

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const result = await startGame(room.id);
      if (result?.error) {
        setError(result.error);
        setStarting(false);
      } else if (result?.gameId) {
        // Redirect immediately — don't wait for realtime
        router.push(`/juego/${result.gameId}`);
      }
    } catch {
      setError("Error al iniciar la partida.");
      setStarting(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }

  async function shareRoom() {
    const url = `${window.location.origin}/sala/${room.code}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Domino Venezolano",
          text: `Unite a mi sala de domino! Codigo: ${room.code}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* noop */ }
  }

  async function handleAddBot() {
    const result = await addBot(room.id);
    if (result?.error) setError(result.error);
  }

  async function handleRemoveBot(seatIndex: number) {
    const result = await removeBot(room.id, seatIndex);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-felt">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4 border-b border-[#c9a84c]/20 bg-[#3a2210]/80 backdrop-blur-sm"
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#f5f0e8] flex items-center justify-center shadow-md">
            <div className="grid grid-cols-2 gap-0.5 p-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-[#2a1a0a]" />
              ))}
            </div>
          </div>
          <span className="font-bold text-sm text-[#a8c4a0] group-hover:text-[#f5f0e8] transition-colors">
            Dominó Venezolano
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/40 flex items-center justify-center text-xs font-bold text-[#c9a84c]">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </motion.nav>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl space-y-8">
          {/* Room code header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3"
          >
            <p className="text-xs uppercase tracking-widest text-[#a8c4a0]/60 font-medium">Código de sala</p>
            <div className="flex items-center justify-center gap-3">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center rounded-2xl bg-[#3a2210]/80 border border-[#c9a84c]/20 px-6 py-3"
              >
                {room.code.split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="text-3xl sm:text-4xl font-mono font-bold text-[#c9a84c] tracking-[0.2em]"
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <motion.button
                onClick={copyCode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#3a2210]/60 border border-[#c9a84c]/20 px-3 py-1.5 text-xs text-[#a8c4a0] hover:text-[#f5f0e8] hover:border-[#c9a84c]/40 transition-all"
              >
                {copied ? <IconCheck /> : <IconCopy />}
                {copied ? "Copiado!" : "Copiar"}
              </motion.button>
              <motion.button
                onClick={shareRoom}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#3a2210]/60 border border-[#c9a84c]/20 px-3 py-1.5 text-xs text-[#a8c4a0] hover:text-[#f5f0e8] hover:border-[#c9a84c]/40 transition-all"
              >
                <IconShare />
                Compartir
              </motion.button>
            </div>
          </motion.div>

          {/* Table layout — 2x2 grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            {/* Center table decoration */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="w-20 h-20 rounded-full bg-[#3a2210]/30 border border-[#c9a84c]/10 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#3a2210]/50 border border-[#c9a84c]/15 flex items-center justify-center">
                  <span className="text-lg">🁣</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
              {seats.map((seat, i) => (
                <SeatCard
                  key={i}
                  seat={seat}
                  index={i}
                  isHost={isHost}
                  isCurrentUser={seat?.user_id === userId}
                  roomHostId={room.host_id}
                  onAddBot={() => handleAddBot()}
                  onRemoveBot={() => handleRemoveBot(i)}
                />
              ))}
            </div>
          </motion.div>

          {/* Player count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2"
          >
            <div className="flex -space-x-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full border-2 border-[#163d28] transition-colors duration-300 ${
                    i < filledCount ? "bg-[#c9a84c]" : "bg-[#1e5c3a]/50"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-[#a8c4a0]">
              {filledCount}/4 jugadores
            </span>
          </motion.div>

          {/* Ready animation when all 4 join */}
          <AnimatePresence>
            {allReady && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-2xl border border-[#c9a84c]/30 p-4 text-center glow-gold"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[#c9a84c] font-semibold"
                >
                  Todos los jugadores estan listos!
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            {isHost ? (
              <>
                <motion.button
                  onClick={handleStart}
                  disabled={!allReady || starting}
                  whileHover={{ scale: !allReady || starting ? 1 : 1.02 }}
                  whileTap={{ scale: !allReady || starting ? 1 : 0.97 }}
                  className={`w-full rounded-2xl px-6 py-4 text-lg font-semibold transition-all flex items-center justify-center gap-3
                    ${
                      allReady
                        ? "bg-gradient-to-r from-[#c9a84c] to-[#dfc06a] hover:from-[#dfc06a] hover:to-[#e8cc7a] shadow-lg shadow-[#c9a84c]/25 text-[#2a1a0a]"
                        : "bg-[#1e5c3a]/30 border border-[#c9a84c]/10 text-[#a8c4a0]/40 cursor-not-allowed"
                    }`}
                >
                  {starting ? (
                    <>
                      <Spinner />
                      Iniciando partida...
                    </>
                  ) : allReady ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      Iniciar partida
                    </>
                  ) : (
                    `Esperando jugadores (${filledCount}/4)`
                  )}
                </motion.button>
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 rounded-xl bg-red-900/20 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="glass rounded-2xl p-4 text-center">
                <p className="text-[#a8c4a0] text-sm">
                  {allReady
                    ? "Esperando que el host inicie la partida..."
                    : `Esperando jugadores (${filledCount}/4)...`}
                </p>
                {!allReady && (
                  <motion.div
                    className="mt-2 flex justify-center"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          className="w-1.5 h-1.5 rounded-full bg-[#a8c4a0]/50"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Leave room */}
            <button
              onClick={async () => {
                await leaveRoom(room.id);
                router.push("/");
              }}
              className="w-full rounded-2xl border border-[#c9a84c]/10 hover:border-red-500/30 bg-[#1e5c3a]/20 hover:bg-red-900/10 px-6 py-3 text-sm font-medium text-[#a8c4a0]/50 hover:text-red-400 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Salir de la sala
            </button>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-[#c9a84c]/15">
        <p className="text-xs text-[#a8c4a0]/50">Dominó Venezolano</p>
      </footer>
    </div>
  );
}
