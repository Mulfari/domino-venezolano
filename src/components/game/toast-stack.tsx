"use client";

import { ReactNode } from "react";

/**
 * Stacks multiple toast notifications vertically so they don't overlap
 * when several fire simultaneously (e.g. ¡Una ficha! + ¡Va a dominar!).
 */
export function ToastStack({ children }: { children: ReactNode }) {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {children}
    </div>
  );
}
