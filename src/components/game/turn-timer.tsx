"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useGameStore } from "@/stores/game-store";

const TURN_DURATION = 30;

interface TurnTimerProps {
  onAutoPass?: () => void;
  onAutoPlay?: () => void;
  onTimeout?: () => void;
}

// Vignette rendered as a portal so it covers the full viewport regardless of stacking context
function UrgentVignette({ seconds }: { seconds: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  // Intensity ramps up: 5s→faint, 1s→intense
  const intensity = Math.max(0, (6 - seconds) / 5); // 0 at 5s, 1 at 0s
  const opacity = 0.25 + intensity * 0.45;
  const pulseSpeed = 0.9 - intensity * 0.45; // faster pulse as time runs out

  return createPortal(
    <motion.div
      key="urgent-vignette"
      initial={{ opacity: 0 }}
      animate={{ opacity: [opacity * 0.6, opacity, opacity * 0.6] }}
      transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
      className="pointer-events-none fixed inset-0 z-[45]"
      aria-hidden="true"
      style={{
        background: `radial-gradient(ellipse at center, transparent 40%, rgba(220,38,38,${opacity}) 100%)`,
        boxShadow: `inset 0 0 ${60 + intensity * 80}px rgba(220,38,38,${opacity * 0.8})`,
      }}
    />,
    document.body
  );
}

export function TurnTimer({ onAutoPass, onAutoPlay, onTimeout }: TurnTimerProps) {
  const currentTurn = useGameStore((s) => s.currentTurn);
  const status = useGameStore((s) => s.status);
  const mySeat = useGameStore((s) => s.mySeat);
  const canPassFn = useGameStore((s) => s.canPass);
  const players = useGameStore((s) => s.players);
  const [seconds, setSeconds] = useState(TURN_DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPassedRef = useRef(false);

  const isMyTurn = mySeat !== null && currentTurn === mySeat;
  const canPass = canPassFn();
  const currentPlayer = players.find((p) => p.seat === currentTurn);
  const isBot = currentPlayer?.isBot ?? false;

  useEffect(() => {
    setSeconds(TURN_DURATION);
    autoPassedRef.current = false;
    if (status !== "playing") return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentTurn, status]);

  useEffect(() => {
    if (seconds === 0 && isMyTurn && !autoPassedRef.current) {
      autoPassedRef.current = true;
      onTimeout?.();
      if (canPass && onAutoPass) {
        onAutoPass();
      } else if (!canPass && onAutoPlay) {
        onAutoPlay();
      }
    }
  }, [seconds, isMyTurn, canPass, onAutoPass, onAutoPlay, onTimeout]);

  if (status !== "playing") return null;
  if (isBot) return null;

  const pct = seconds / TURN_DURATION;
  const urgent = seconds <= 10;
  const critical = seconds <= 5;

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);

  const shakeVariants = {
    idle: { x: 0, rotate: 0 },
    shake: {
      x: [0, -3, 3, -3, 3, -2, 2, 0],
      rotate: [0, -4, 4, -4, 4, -2, 2, 0],
      transition: { duration: 0.5, ease: "easeInOut" as const },
    },
  };

  return (
    <>
      {/* Full-screen vignette when it's my turn and critical */}
      <AnimatePresence>
        {isMyTurn && critical && (
          <UrgentVignette key={`vignette-${seconds}`} seconds={seconds} />
        )}
      </AnimatePresence>

      <div
        className="flex items-center gap-1.5 sm:gap-2"
        role="timer"
        aria-label={`${seconds} segundos restantes${isMyTurn ? " en tu turno" : ""}`}
      >
        {/* Timer circle — shakes when critical on my turn */}
        <motion.div
          className="relative w-8 h-8 sm:w-10 sm:h-10"
          aria-hidden="true"
          variants={shakeVariants}
          animate={isMyTurn && critical ? "shake" : "idle"}
          // Re-trigger shake each second
          key={isMyTurn && critical ? seconds : "idle"}
        >
          <svg width="100%" height="100%" viewBox="0 0 40 40" className="-rotate-90">
            <circle
              cx={20} cy={20} r={radius}
              fill="none"
              stroke="#1e5c3a"
              strokeWidth={3}
            />
            <motion.circle
              cx={20} cy={20} r={radius}
              fill="none"
              stroke={urgent ? "#ef4444" : isMyTurn ? "#c9a84c" : "#a8c4a0"}
              strokeWidth={critical ? 4 : 3}
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          {/* Pulsing red glow ring when critical */}
          {isMyTurn && critical && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{ boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 14px rgba(239,68,68,0.8)", "0 0 0px rgba(239,68,68,0)"] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <span
            className={`absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold tabular-nums ${
              urgent ? "text-red-400" : isMyTurn ? "text-[#c9a84c]" : "text-[#a8c4a0]/70"
            }`}
            aria-hidden="true"
          >
            {seconds}
          </span>
        </motion.div>

        {urgent && isMyTurn && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: critical ? 0.4 : 0.6, repeat: Infinity }}
            className="hidden sm:inline text-xs text-red-400 font-semibold"
            aria-live="assertive"
            aria-atomic="true"
          >
            ¡Apúrate!
          </motion.span>
        )}
      </div>
    </>
  );
}
