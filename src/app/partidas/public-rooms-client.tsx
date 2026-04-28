"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface RoomInfo {
  id: string;
  code: string;
  playerCount: number;
  playerNames: string[];
  createdAt: string;
}

interface Props {
  rooms: RoomInfo[];
}

export function PublicRoomsClient({ rooms }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-felt">
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4 border-b border-[#c9a84c]/20 bg-[#3a2210]/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#f5f0e8] flex items-center justify-center shadow-md">
            <div className="grid grid-cols-2 gap-0.5 p-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-[#2a1a0a]" />
              ))}
            </div>
          </div>
          <span className="font-bold text-sm text-[#f5f0e8] tracking-tight">
            Dominó Venezolano
          </span>
        </div>
        <Link
          href="/"
          className="text-sm text-[#c9a84c] hover:text-[#dfc06a] font-medium transition-colors"
        >
          ← Volver
        </Link>
      </motion.nav>

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-1"
          >
            <h1 className="text-xl font-bold text-[#f5f0e8]">Partidas públicas</h1>
            <p className="text-sm text-[#a8c4a0]">Únete a una sala abierta</p>
          </motion.div>

          {rooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-8 text-center space-y-3"
            >
              <div className="text-4xl">🎲</div>
              <p className="text-[#a8c4a0] text-sm">
                No hay salas públicas disponibles ahora mismo.
              </p>
              <Link
                href="/"
                className="inline-block rounded-xl bg-[#c9a84c] hover:bg-[#dfc06a] px-5 py-2 text-sm font-semibold text-[#2a1a0a] transition-colors"
              >
                Crear una sala
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room, i) => {
                const timeAgo = getTimeAgo(room.createdAt);
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/sala/${room.code}`}
                      className="block glass rounded-2xl p-4 hover:bg-[#1e5c3a]/40 transition-colors border border-transparent hover:border-[#c9a84c]/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center text-sm font-mono font-bold text-[#c9a84c] shrink-0">
                            {room.playerCount}/4
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#f5f0e8] font-mono tracking-wider">
                              {room.code}
                            </p>
                            <p className="text-xs text-[#a8c4a0] truncate">
                              {room.playerNames.join(", ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-[#a8c4a0]/50">{timeAgo}</span>
                          <svg className="w-4 h-4 text-[#c9a84c]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
