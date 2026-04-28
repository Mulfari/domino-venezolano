"use client";

import { useState, useRef, useCallback } from "react";
import { joinRoom } from "@/lib/rooms/actions";
import { motion } from "framer-motion";

const CODE_LENGTH = 6;

export function JoinRoomForm() {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");

  const setRef = useCallback(
    (idx: number) => (el: HTMLInputElement | null) => {
      inputRefs.current[idx] = el;
    },
    []
  );

  function focusInput(idx: number) {
    inputRefs.current[idx]?.focus();
  }

  function handleChange(idx: number, value: string) {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    setError(null);

    if (char && idx < CODE_LENGTH - 1) {
      focusInput(idx + 1);
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      focusInput(idx - 1);
      const next = [...digits];
      next[idx - 1] = "";
      setDigits(next);
    }
    if (e.key === "ArrowLeft" && idx > 0) focusInput(idx - 1);
    if (e.key === "ArrowRight" && idx < CODE_LENGTH - 1) focusInput(idx + 1);
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < CODE_LENGTH; i++) {
      next[i] = pasted[i] || "";
    }
    setDigits(next);
    setError(null);

    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    focusInput(focusIdx);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setError("El codigo debe tener 6 caracteres.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await joinRoom(code);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("Error al unirse a la sala.");
    } finally {
      setLoading(false);
    }
  }

  const isFull = code.length === CODE_LENGTH;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Code input boxes */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <motion.input
            key={i}
            ref={setRef(i)}
            type="text"
            inputMode="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            whileFocus={{ scale: 1.05 }}
            className={`w-11 h-14 sm:w-12 sm:h-16 rounded-xl text-center text-xl font-mono font-bold uppercase transition-all
              ${
                digit
                  ? "bg-[#f5f0e8] border-[#c9a84c]/60 text-[#2a1a0a] shadow-sm shadow-[#c9a84c]/15"
                  : "bg-[#1e5c3a]/40 border-[#c9a84c]/20 text-[#f5f0e8]"
              }
              border focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 focus:border-[#c9a84c]/50`}
            aria-label={`Caracter ${i + 1} del codigo`}
          />
        ))}
      </div>

      {/* Join button */}
      <motion.button
        type="submit"
        disabled={loading || !isFull}
        whileHover={{ scale: loading || !isFull ? 1 : 1.02 }}
        whileTap={{ scale: loading || !isFull ? 1 : 0.97 }}
        className={`w-full rounded-2xl px-6 py-3.5 font-semibold text-sm transition-all flex items-center justify-center gap-2
          ${
            isFull
              ? "bg-[#3a2210] hover:bg-[#4a2c0f] border border-[#c9a84c]/30 text-[#f5f0e8] shadow-lg"
              : "bg-[#1e5c3a]/20 border border-[#c9a84c]/10 text-[#a8c4a0]/40 cursor-not-allowed"
          }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uniendose...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Unirse a la sala
          </>
        )}
      </motion.button>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl bg-red-900/20 border border-red-500/20 px-4 py-2.5 text-sm text-red-300"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </motion.div>
      )}
    </form>
  );
}
