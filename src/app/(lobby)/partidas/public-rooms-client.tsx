"use client";

import { createClient } from "@/lib/supabase/client";
import { joinRoom } from "@/lib/rooms/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Seat = { user_id: string; display_name: string } | null;

interface PublicRoom {
  id: string;
  code: string;
  host_id: string;
  seats: Seat[];
  status: string;
  is_private: boolean;
  created_at: string;
}

interface Props {
  initialRooms: PublicRoom[];
  userId: string;
  displayName: string;
}

export function PublicRoomsClient({ initialRooms, userId, displayName }: Props) {
  const [rooms, setRooms] = useState<PublicRoom[]>(initialRooms);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("public-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const room = payload.new as PublicRoom;
            if (room.status === "waiting" && !room.is_private) {
              setRooms((prev) => [room, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const room = payload.new as PublicRoom;
            setRooms((prev) => {
              if (room.status !== "waiting" || room.is_private) {
                return prev.filter((r) => r.id !== room.id);
              }
              return prev.map((r) => (r.id === room.id ? room : r));
            });
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setRooms((prev) => prev.filter((r) => r.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleJoin(code: string) {
    setJoining(code);
    setError(null);
    try {
      const result = await joinRoom(code);
      if (result?.error) {
        setError(result.error);
        setJoining(null);
      }
    } catch {
      setError("Error al unirse a la sala.");
      setJoining(null);
    }
  }

  function getOpenSeats(seats: Seat[]) {
    return seats.filter((s) => s === null).length;
  }

  function getHostName(room: PublicRoom) {
    const host = room.seats.find((s) => s?.user_id === room.host_id);
    return host?.display_name ?? "Desconocido";
  }

  function isAlreadyIn(room: PublicRoom) {
    return room.seats.some((s) => s?.user_id === userId);
  }

  return (
    <div className="min-h-screen flex flex-col">
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
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold text-white">Partidas públicas</h1>
              <p className="text-sm text-[#a8c4a0] mt-1">
                {rooms.length} sala{rooms.length !== 1 ? "s" : ""} disponible{rooms.length !== 1 ? "s" : ""}
              </p>
            </div>
            <motion.button
              onClick={() => router.refresh()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl bg-[#3a2210]/60 border border-[#c9a84c]/20 px-4 py-2 text-sm text-[#a8c4a0] hover:text-[#f5f0e8] hover:border-[#c9a84c]/40 transition-all"
            >
              Actualizar
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {rooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-12 text-center space-y-4"
            >
              <div className="text-4xl">🎲</div>
              <p className="text-[#a8c4a0]">No hay partidas públicas disponibles.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[#c9a84c] hover:bg-[#dfc06a] px-5 py-2.5 text-sm font-medium text-[#2a1a0a] transition-colors"
              >
                Crear una sala
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room, i) => {
                const openSeats = getOpenSeats(room.seats);
                const hostName = getHostName(room);
                const alreadyIn = isAlreadyIn(room);
                const isJoining = joining === room.code;

                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-2xl border border-[#c9a84c]/15 p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#c9a84c] tracking-wider">
                          {room.code}
                        </span>
                        <span className="text-xs text-[#a8c4a0]/40">•</span>
                        <span className="text-sm text-[#a8c4a0] truncate">
                          Host: {hostName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex -space-x-1">
                          {[0, 1, 2, 3].map((s) => (
                            <div
                              key={s}
                              className={`w-2.5 h-2.5 rounded-full border-2 border-[#163d28] ${
                                room.seats[s] ? "bg-[#c9a84c]" : "bg-[#1e5c3a]/50"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-[#a8c4a0]/60">
                          {4 - openSeats}/4 jugadores
                        </span>
                      </div>
                    </div>

                    {alreadyIn ? (
                      <Link
                        href={`/sala/${room.code}`}
                        className="rounded-xl bg-[#c9a84c]/20 border border-[#c9a84c]/30 px-4 py-2 text-sm font-medium text-[#c9a84c] hover:bg-[#c9a84c]/30 transition-colors whitespace-nowrap"
                      >
                        Volver
                      </Link>
                    ) : openSeats > 0 ? (
                      <motion.button
                        onClick={() => handleJoin(room.code)}
                        disabled={isJoining}
                        whileHover={{ scale: isJoining ? 1 : 1.05 }}
                        whileTap={{ scale: isJoining ? 1 : 0.95 }}
                        className="rounded-xl bg-[#c9a84c] hover:bg-[#dfc06a] disabled:bg-[#2a3a2a] px-4 py-2 text-sm font-medium text-[#2a1a0a] transition-colors whitespace-nowrap"
                      >
                        {isJoining ? "Uniendo..." : "Unirse"}
                      </motion.button>
                    ) : (
                      <span className="text-xs text-[#a8c4a0]/40 px-3 py-2">Llena</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Back link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <Link
              href="/"
              className="text-sm text-[#a8c4a0]/60 hover:text-[#f5f0e8] transition-colors"
            >
              ← Volver al inicio
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
