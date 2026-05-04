"use client";

import { useEffect } from "react";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GameError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#163d28] px-4">
      {/* Felt dot pattern background */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm space-y-6 text-center">
        {/* Domino icon */}
        <div className="mx-auto w-16 h-16 flex items-center justify-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="8"
              y="4"
              width="32"
              height="40"
              rx="4"
              fill="#3a2210"
              stroke="#c9a84c"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <line
              x1="8"
              y1="24"
              x2="40"
              y2="24"
              stroke="#c9a84c"
              strokeWidth="1"
              opacity="0.5"
            />
            {/* Sad face with pips */}
            <circle cx="18" cy="14" r="2.5" fill="#f5f0e8" opacity="0.7" />
            <circle cx="30" cy="14" r="2.5" fill="#f5f0e8" opacity="0.7" />
            <path
              d="M18 36 Q24 32 30 36"
              stroke="#f5f0e8"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Error card */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(58,34,16,0.85) 0%, rgba(30,14,4,0.9) 100%)",
            border: "1px solid rgba(201,168,76,0.25)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.1)",
          }}
          role="alert"
        >
          <h2
            className="text-lg font-bold"
            style={{ color: "#c9a84c" }}
          >
            ¡Algo salió mal!
          </h2>

          <p
            className="text-sm leading-relaxed"
            style={{ color: "#a8c4a0" }}
          >
            Ocurrió un error inesperado en la partida. Puedes intentar
            recuperar la sesión o volver al inicio.
          </p>

          {error.digest && (
            <p
              className="text-[10px] font-mono tabular-nums"
              style={{ color: "rgba(168,196,160,0.4)" }}
            >
              Ref: {error.digest}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={reset}
              className="w-full rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200"
              style={{
                background:
                  "linear-gradient(135deg, #c9a84c 0%, #a8862a 100%)",
                color: "#1a0e00",
                border: "1px solid rgba(232,201,106,0.6)",
                boxShadow:
                  "0 2px 12px rgba(201,168,76,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              Reintentar
            </button>

            <a
              href="/"
              className="block w-full rounded-xl px-5 py-2.5 text-sm transition-colors duration-200"
              style={{
                color: "rgba(168,196,160,0.7)",
                border: "1px solid rgba(168,196,160,0.15)",
              }}
            >
              Volver al inicio
            </a>
          </div>
        </div>

        {/* Subtle hint */}
        <p
          className="text-[11px]"
          style={{ color: "rgba(168,196,160,0.35)" }}
        >
          Si el problema persiste, recarga la página
        </p>
      </div>
    </div>
  );
}
