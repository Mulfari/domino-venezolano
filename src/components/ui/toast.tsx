"use client";
import { create } from "zustand";
import { useEffect } from "react";

interface Toast {
  id: string;
  message: string;
  variant: "info" | "error" | "success";
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string, variant?: Toast["variant"]) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, variant = "info") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-lg text-ivory shadow-lg ${
            t.variant === "error"
              ? "bg-red-700"
              : t.variant === "success"
              ? "bg-green-700"
              : "bg-wood border border-gold"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
