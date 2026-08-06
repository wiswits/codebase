import type { InputHTMLAttributes } from "react";

interface InputFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

export function InputField({
  label,
  error,
  hint,
  required,
  inputProps,
}: InputFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        {...inputProps}
        className={`
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          px-4
          py-3
          text-sm
          text-slate-800
          shadow-sm
          outline-none
          transition-all
          duration-300
          placeholder:text-slate-400
          focus:border-[#1F3A5F]
          focus:ring-4
          focus:ring-[#1F3A5F]/10
          disabled:bg-slate-100
          disabled:cursor-not-allowed
          ${inputProps?.className ?? ""}
        `}
      />

      {hint && !error && (
        <span className="text-xs text-slate-500">{hint}</span>
      )}

      {error && (
        <span className="text-xs font-medium text-red-600">{error}</span>
      )}
    </label>
  );
}