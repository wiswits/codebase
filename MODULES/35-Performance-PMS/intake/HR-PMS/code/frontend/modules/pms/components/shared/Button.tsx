"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95";

  const variants = {
    primary:
      "bg-[#1F3A5F] text-white hover:bg-[#284B78] hover:-translate-y-0.5 hover:shadow-xl focus:ring-[#1F3A5F]/20",

    secondary:
      "border border-[#1F3A5F] bg-white text-[#1F3A5F] hover:bg-[#F8FAFC] hover:-translate-y-0.5 hover:shadow-lg focus:ring-[#1F3A5F]/10",

    ghost:
      "text-[#1F3A5F] hover:bg-[#EEF3F8] focus:ring-[#1F3A5F]/10",

    danger:
      "bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-xl focus:ring-red-200",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.25"
          />
          <path
            d="M22 12a10 10 0 00-10-10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}

      {children}
    </button>
  );
}