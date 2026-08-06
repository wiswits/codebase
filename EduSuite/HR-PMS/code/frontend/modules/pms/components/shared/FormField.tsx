"use client";

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

/* ============================================================
   TEXT FIELD
============================================================ */

interface TextFieldProps extends BaseFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

export function TextField({
  label,
  required,
  error,
  hint,
  value,
  onChange,
  inputProps,
}: TextFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        {...inputProps}
        value={value ?? inputProps?.value}
        onChange={(e) => {
          inputProps?.onChange?.(e);
          onChange?.(e.target.value);
        }}
        className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-300 focus:border-[#1F3A5F] focus:ring-4 focus:ring-[#1F3A5F]/10 ${
          inputProps?.className ?? ""
        }`}
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

/* ============================================================
   TEXTAREA
============================================================ */

interface TextAreaFieldProps extends BaseFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
}

export function TextAreaField({
  label,
  required,
  error,
  hint,
  value,
  onChange,
  textareaProps,
}: TextAreaFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <textarea
        {...textareaProps}
        value={value ?? textareaProps?.value}
        onChange={(e) => {
          textareaProps?.onChange?.(e);
          onChange?.(e.target.value);
        }}
        className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-300 focus:border-[#1F3A5F] focus:ring-4 focus:ring-[#1F3A5F]/10 ${
          textareaProps?.className ?? ""
        }`}
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

/* ============================================================
   SELECT
============================================================ */

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps extends BaseFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  selectProps?: SelectHTMLAttributes<HTMLSelectElement>;
}

export function SelectField({
  label,
  required,
  error,
  hint,
  value,
  onChange,
  options,
  selectProps,
}: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <select
        {...selectProps}
        value={value ?? selectProps?.value}
        onChange={(e) => {
          selectProps?.onChange?.(e);
          onChange?.(e.target.value);
        }}
        className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-300 focus:border-[#1F3A5F] focus:ring-4 focus:ring-[#1F3A5F]/10 ${
          selectProps?.className ?? ""
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hint && !error && (
        <span className="text-xs text-slate-500">{hint}</span>
      )}

      {error && (
        <span className="text-xs font-medium text-red-600">{error}</span>
      )}
    </label>
  );
}