"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface ProfileClientProps {
  displayName: string;
  email: string;
  gamesPlayed: number;
  gamesWon: number;
  winStreak: number;
  winRate: number;
  memberSince: string;
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl p-4 text-center flex-1 min-w-0">
      <p className={`text-2xl font-bold ${accent ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}>{value}</p>
      <p className="text-xs text-[#a8c4a0] mt-0.5">{label}</p>
    </div>
  );
}

export function ProfileClient({
  displayName,
  email,
  gamesPlayed,
  gamesWon,
  winStreak,
  winRate,
  memberSince,
}: ProfileClientProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const formattedDate = new Date(memberSince).toLocaleDateString("es-VE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col bg-felt">
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4 border-b border-[#c9a84c]/20 bg-[#3a2210]/80 backdrop-blur-sm"
      >
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
        </Link>
        <Link
          href="/"
          className="text-sm text-[#c9a84c] hover:text-[#dfc06a] font-medium transition-colors"
        >
          ← Volver
        </Link>
      </motion.nav>

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 text-center space-y-4"
          >
            <div className="w-20 h-20 rounded-full bg-[#c9a84c]/15 border-2 border-[#c9a84c]/40 flex items-center justify-center mx-auto text-3xl font-bold text-[#c9a84c]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#f5f0e8]">{displayName}</h1>
              <p className="text-sm text-[#a8c4a0]">{email}</p>
            </div>
            <p className="text-xs text-[#a8c4a0]/60">
              Miembro desde {formattedDate}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <h2 className="text-sm font-semibold text-[#e8dcc8] px-1">Estadísticas</h2>
            <div className="flex gap-3">
              <StatCard label="Partidas" value={String(gamesPlayed)} />
              <StatCard label="Victorias" value={String(gamesWon)} accent />
              <StatCard label="% Victoria" value={gamesPlayed > 0 ? `${winRate}%` : "—"} />
            </div>
            <div className="flex gap-3">
              <StatCard label="Derrotas" value={String(gamesPlayed - gamesWon)} />
              <StatCard label="Racha actual" value={winStreak > 0 ? `${winStreak} 🔥` : "—"} accent={winStreak > 0} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={handleSignOut}
              className="w-full rounded-2xl border border-red-500/20 bg-red-950/20 hover:bg-red-950/40 px-6 py-3 text-sm font-medium text-red-300 hover:text-red-200 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Cerrar sesión
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
