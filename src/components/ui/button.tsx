"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: "bg-gold text-wood hover:brightness-110 border-2 border-gold",
  secondary: "bg-wood text-ivory border-2 border-gold hover:bg-wood/80",
  ghost: "bg-transparent text-ivory border-2 border-ivory/30 hover:bg-ivory/10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = "Button";
