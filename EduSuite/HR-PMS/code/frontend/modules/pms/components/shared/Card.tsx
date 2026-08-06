import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  hover?: boolean;
}

export function Card({
  children,
  className = "",
  as: As = "div",
  hover = true,
}: CardProps) {
  return (
    <As
      className={`
        relative
        overflow-hidden
        rounded-2xl
        border
        border-slate-200/80
        bg-white
        p-6
        shadow-[0_6px_20px_rgba(15,23,42,0.06)]
        transition-all
        duration-300
        ease-out
        ${
          hover
            ? "hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
            : ""
        }
        ${className}
      `}
    >
      {/* Premium top accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#1F3A5F] via-[#2E5B8C] to-[#B4762A]" />

      {children}
    </As>
  );
}