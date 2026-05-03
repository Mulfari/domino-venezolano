"use client";

import { useEffect, useRef, useState } from "react";
import { isMuted, setMuted, getVolume, setVolume } from "@/lib/sounds/sound-engine";

export function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted());
  const [volume, setVolumeState] = useState(getVolume());
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
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

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setVolumeState(v);
    // Unmute automatically when user raises volume
    if (v > 0 && muted) {
      setMuted(false);
      setMutedState(false);
    }
  }

  const effectiveMuted = muted || volume === 0;
  const volPct = Math.round(volume * 100);

  // Icon: muted, low, medium, high
  function VolumeIcon() {
    if (effectiveMuted) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      );
    }
    if (volume < 0.35) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Main button — click opens popover, long-press / right-click not needed */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg bg-[#3a2210]/80 border border-[#c9a84c]/20 px-2.5 py-1.5 text-[#a8c4a0] hover:text-[#f5f0e8] transition-colors flex items-center gap-1.5"
        aria-label={effectiveMuted ? "Sonido silenciado — abrir control de volumen" : `Volumen ${volPct}% — abrir control de volumen`}
        aria-expanded={open}
        style={{ minHeight: 36 }}
      >
        <VolumeIcon />
        {/* Volume percentage — hidden on mobile to save space */}
        <span
          className="hidden sm:inline text-[10px] font-semibold tabular-nums leading-none"
          style={{ color: effectiveMuted ? "rgba(168,196,160,0.4)" : "rgba(201,168,76,0.75)" }}
          aria-hidden="true"
        >
          {effectiveMuted ? "—" : `${volPct}%`}
        </span>
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #2a1a08 0%, #1a1008 100%)",
            borderColor: "rgba(201,168,76,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)",
            minWidth: 180,
          }}
          role="dialog"
          aria-label="Control de volumen"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ borderColor: "rgba(201,168,76,0.15)" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c]">
              Volumen
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="text-[#a8c4a0]/40 hover:text-[#a8c4a0]/80 transition-colors text-xs leading-none px-1"
            >
              ✕
            </button>
          </div>

          <div className="px-3 py-3 flex flex-col gap-3">
            {/* Slider row */}
            <div className="flex items-center gap-2">
              {/* Low-volume icon */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(168,196,160,0.45)" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>

              <div className="relative flex-1 flex items-center" style={{ height: 20 }}>
                {/* Track background */}
                <div
                  className="absolute inset-y-0 left-0 right-0 my-auto rounded-full"
                  style={{ height: 4, background: "rgba(255,255,255,0.08)" }}
                />
                {/* Filled portion */}
                <div
                  className="absolute inset-y-0 left-0 my-auto rounded-full"
                  style={{
                    height: 4,
                    width: `${volume * 100}%`,
                    background: effectiveMuted
                      ? "rgba(168,196,160,0.25)"
                      : "linear-gradient(90deg, #a07830 0%, #c9a84c 100%)",
                    transition: "width 0.05s",
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={handleVolume}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  style={{ height: "100%" }}
                  aria-label="Nivel de volumen"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={volPct}
                  aria-valuetext={`${volPct}%`}
                />
                {/* Thumb */}
                <div
                  className="absolute rounded-full border-2 pointer-events-none"
                  style={{
                    width: 14,
                    height: 14,
                    left: `calc(${volume * 100}% - 7px)`,
                    background: effectiveMuted ? "#4a3a2a" : "#c9a84c",
                    borderColor: effectiveMuted ? "rgba(168,196,160,0.3)" : "#e8c96a",
                    boxShadow: effectiveMuted ? "none" : "0 0 6px rgba(201,168,76,0.6)",
                    transition: "left 0.05s, background 0.2s",
                  }}
                />
              </div>

              {/* High-volume icon */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(168,196,160,0.45)" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>

            {/* Percentage label + mute toggle */}
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-black tabular-nums leading-none"
                style={{ color: effectiveMuted ? "rgba(168,196,160,0.35)" : "#c9a84c" }}
                aria-hidden="true"
              >
                {effectiveMuted ? "Silenciado" : `${volPct}%`}
              </span>

              <button
                onClick={toggleMute}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                style={{
                  background: effectiveMuted ? "rgba(168,196,160,0.08)" : "rgba(201,168,76,0.12)",
                  border: `1px solid ${effectiveMuted ? "rgba(168,196,160,0.2)" : "rgba(201,168,76,0.3)"}`,
                  color: effectiveMuted ? "rgba(168,196,160,0.6)" : "#c9a84c",
                }}
                aria-label={effectiveMuted ? "Activar sonido" : "Silenciar"}
              >
                {effectiveMuted ? (
                  <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    Activar
                  </>
                ) : (
                  <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    Silenciar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
