"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode, useState } from "react";

/* ── Floating domino tile ─────────────────────── */
function DominoTile({
  top,
  bottom,
  delay,
  x,
  y,
}: {
  top: number;
  bottom: number;
  delay: number;
  x: string;
  y: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.6, type: "spring" }}
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3 + delay, repeat: Infinity, ease: "easeInOut" }}
        className="w-10 h-16 sm:w-12 sm:h-20 rounded-lg bg-[#f5f0e8] border border-[#d4c9a8] flex flex-col items-center justify-center gap-0.5 shadow-lg"
      >
        <DotGrid count={top} />
        <div className="w-6 sm:w-8 h-px bg-[#c4b896]" />
        <DotGrid count={bottom} />
      </motion.div>
    </motion.div>
  );
}

function DotGrid({ count }: { count: number }) {
  const positions: Record<number, number[][]> = {
    0: [],
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
  };
  return (
    <div className="relative w-5 h-5 sm:w-6 sm:h-6">
      {(positions[count] || []).map(([col, row], i) => (
        <div
          key={i}
          className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#2a1a0a]"
          style={{
            left: `${(col / 2) * 100}%`,
            top: `${(row / 2) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}

/* ── Stat card ────────────────────────────────── */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4 text-center flex-1 min-w-0">
      <p className="text-2xl font-bold text-[#f5f0e8]">{value}</p>
      <p className="text-xs text-[#a8c4a0] mt-0.5">{label}</p>
    </div>
  );
}

/* ── Create room form ────────────────────────── */
function CreateRoomForm({ action }: { action: (opts: { isPrivate: boolean; password?: string }) => Promise<unknown> }) {
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    setLoading(true);
    try {
      await action({ isPrivate, password: isPrivate && password.trim() ? password.trim() : undefined });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between glass rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#a8c4a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {isPrivate ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            )}
          </svg>
          <span className="text-sm text-[#e8dcc8]">{isPrivate ? "Sala privada" : "Sala pública"}</span>
        </div>
        <button
          type="button"
          onClick={() => { setIsPrivate(!isPrivate); if (isPrivate) setPassword(""); }}
          className={`relative w-10 h-5 rounded-full transition-colors ${isPrivate ? "bg-[#c9a84c]" : "bg-[#1e5c3a]/60"}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#f5f0e8] transition-transform ${isPrivate ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {isPrivate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña (opcional)"
            maxLength={32}
            className="w-full rounded-xl bg-[#1e5c3a]/30 border border-[#c9a84c]/20 px-4 py-2.5 text-sm text-[#f5f0e8] placeholder-[#a8c4a0]/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
          />
        </motion.div>
      )}

      <form action={handleSubmit}>
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          className="w-full rounded-2xl bg-gradient-to-r from-[#1e5c3a] to-[#267a4d] hover:from-[#267a4d] hover:to-[#2e9058] disabled:from-[#2a3a2a] disabled:to-[#2a3a2a] px-6 py-4 text-lg font-semibold text-[#f5f0e8] transition-all shadow-lg shadow-[#1e5c3a]/30 disabled:shadow-none flex items-center justify-center gap-3 border border-[#c9a84c]/20"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando sala...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {isPrivate ? "Crear sala privada" : "Crear sala pública"}
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}

/* ── Feature card ────────────────────────────── */
function FeatureCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="glass rounded-2xl p-5 text-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center mx-auto text-[#c9a84c]">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#f5f0e8]">{title}</h3>
      <p className="text-xs text-[#a8c4a0] leading-relaxed">{description}</p>
    </div>
  );
}

/* ── Quick play button ───────────────────────── */
function QuickPlayButton({ action }: { action: () => Promise<unknown> }) {
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={async () => {
        setLoading(true);
        try { await action(); } finally { setLoading(false); }
      }}
    >
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.97 }}
        className="w-full rounded-2xl bg-gradient-to-r from-[#c9a84c] to-[#dfc06a] hover:from-[#dfc06a] hover:to-[#e8cc7a] disabled:from-[#2a3a2a] disabled:to-[#2a3a2a] px-6 py-4 text-lg font-semibold text-[#2a1a0a] transition-all shadow-lg shadow-[#c9a84c]/25 disabled:shadow-none disabled:text-[#6b7b6b] flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Buscando partida...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            ¡Jugar ahora!
          </>
        )}
      </motion.button>
    </form>
  );
}

/* ── Main lobby client ────────────────────────── */
interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  winStreak: number;
}

interface Props {
  user: { displayName: string; stats: PlayerStats } | null;
  createRoomAction: (opts: { isPrivate: boolean; password?: string }) => Promise<unknown>;
  quickPlayAction: () => Promise<unknown>;
  joinRoomForm: ReactNode;
}

export function LobbyClient({ user, createRoomAction, quickPlayAction, joinRoomForm }: Props) {
  const tiles = [
    { top: 6, bottom: 6, delay: 0.2, x: "5%", y: "15%" },
    { top: 3, bottom: 5, delay: 0.5, x: "85%", y: "10%" },
    { top: 1, bottom: 4, delay: 0.8, x: "10%", y: "70%" },
    { top: 2, bottom: 6, delay: 1.0, x: "80%", y: "65%" },
    { top: 0, bottom: 3, delay: 1.2, x: "50%", y: "5%" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-felt">
      {/* Floating domino tiles (decorative) */}
      <div className="absolute inset-0 pointer-events-none hidden sm:block" aria-hidden="true">
        {tiles.map((t, i) => (
          <DominoTile key={i} {...t} />
        ))}
      </div>

      {/* Nav bar — wood panel style */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[#c9a84c]/20 bg-[#3a2210]/80 backdrop-blur-sm"
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
        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/perfil"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/40 flex items-center justify-center text-xs font-bold text-[#c9a84c]">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-[#e8dcc8] hidden sm:block">{user.displayName}</span>
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm text-[#c9a84c] hover:text-[#dfc06a] font-medium transition-colors"
          >
            Iniciar sesión
          </Link>
        )}
      </motion.nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-lg space-y-10">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-24 h-24 rounded-3xl bg-[#f5f0e8] flex items-center justify-center shadow-xl glow-gold"
            >
              <div className="grid grid-cols-2 gap-2 p-4">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 300 }}
                    className="w-3.5 h-3.5 rounded-full bg-[#2a1a0a]"
                  />
                ))}
              </div>
            </motion.div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#f5f0e8]">
                Dominó{" "}
                <span className="text-[#c9a84c]">Venezolano</span>
              </h1>
              <p className="mt-3 text-[#a8c4a0] text-base sm:text-lg max-w-sm mx-auto">
                Partidas de 4 jugadores en parejas. Crea una sala, invita a tus amigos y juega en tiempo real.
              </p>
            </div>
          </motion.div>

          {/* Stats row */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3"
            >
              <StatCard label="Partidas" value={String(user.stats.gamesPlayed)} />
              <StatCard label="Victorias" value={String(user.stats.gamesWon)} />
              <StatCard label="Racha" value={user.stats.winStreak > 0 ? `${user.stats.winStreak} 🔥` : "—"} />
            </motion.div>
          )}

          {/* User status + actions */}
          {user ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              {/* Logged in badge */}
              <div className="glass rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/30 flex items-center justify-center text-sm font-bold text-[#c9a84c]">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#a8c4a0]">Jugando como</p>
                  <p className="font-semibold text-[#c9a84c] truncate">{user.displayName}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
              </div>

              <QuickPlayButton action={quickPlayAction} />

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#c9a84c]/15" />
                <span className="text-xs text-[#a8c4a0]/60 uppercase tracking-wider">o crea tu propia sala</span>
                <div className="flex-1 h-px bg-[#c9a84c]/15" />
              </div>

              <CreateRoomForm action={createRoomAction} />

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#c9a84c]/15" />
                <span className="text-xs text-[#a8c4a0]/60 uppercase tracking-wider">o únete por código</span>
                <div className="flex-1 h-px bg-[#c9a84c]/15" />
              </div>

              {joinRoomForm}

              <Link
                href="/partidas"
                className="w-full rounded-2xl border border-[#c9a84c]/15 hover:border-[#c9a84c]/30 bg-[#1e5c3a]/30 hover:bg-[#1e5c3a]/50 px-6 py-3 text-sm font-medium text-[#a8c4a0] hover:text-[#c9a84c] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
                Ver partidas públicas
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-8 text-center space-y-5"
            >
              <div className="w-14 h-14 rounded-full bg-[#1e5c3a]/50 border border-[#c9a84c]/20 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-[#a8c4a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <p className="text-[#f5f0e8] font-semibold">Inicia sesión para jugar</p>
                <p className="text-sm text-[#a8c4a0] mt-1">Crea tu cuenta gratis y empieza a jugar dominó</p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#c9a84c] to-[#dfc06a] hover:from-[#dfc06a] hover:to-[#e8cc7a] px-8 py-3 font-semibold text-sm text-[#2a1a0a] transition-all shadow-lg shadow-[#c9a84c]/20"
              >
                Iniciar sesión
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </motion.div>
          )}
        </div>
      </main>

      {/* Features section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 px-4 py-12 border-t border-[#c9a84c]/15"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-lg font-semibold text-[#e8dcc8] mb-8">
            ¿Por qué jugar aquí?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
              title="Tiempo real"
              description="Juega con tus amigos sin lag. Broadcast instantáneo con Supabase Realtime."
            />
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>}
              title="Desde cualquier dispositivo"
              description="Juega desde tu celular, tablet o computadora. Diseño adaptable y touch-friendly."
            />
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>}
              title="Parejas venezolanas"
              description="Reglas auténticas: 4 jugadores, 28 fichas, doble-seis. Partida a 100 puntos."
            />
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 text-center py-6 border-t border-[#c9a84c]/15"
      >
        <p className="text-xs text-[#a8c4a0]/50">
          Dominó Venezolano — Parejas — 28 fichas — Partida a 100 puntos
        </p>
      </motion.footer>
    </div>
  );
}
