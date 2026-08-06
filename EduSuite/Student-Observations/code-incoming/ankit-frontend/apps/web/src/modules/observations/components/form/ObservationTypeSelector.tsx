"use client";

import { OBSERVATION_TYPE_OPTIONS } from "../../constants/observation.constants";
import type { ObservationType } from "../../types/observation.types";

interface ObservationTypeSelectorProps {
  value: ObservationType | "";
  error?: string;
  onChange: (type: ObservationType) => void;
}

export default function ObservationTypeSelector({
  value,
  error,
  onChange,
}: ObservationTypeSelectorProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-[#0F2147]">
        Observation Type <span className="text-red-600">*</span>
      </legend>

      <div className="grid gap-3 md:grid-cols-2">
        {OBSERVATION_TYPE_OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-xl border p-4 text-left transition ${
                selected
                  ? "border-[#C8A04E] bg-[#C8A04E]/10 ring-2 ring-[#C8A04E]/20"
                  : "border-slate-200 bg-white hover:border-[#C8A04E]/60"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? "border-[#0F2147]"
                      : "border-slate-400"
                  }`}
                >
                  {selected && (
                    <span className="h-2 w-2 rounded-full bg-[#0F2147]" />
                  )}
                </span>

                <span>
                  <span className="block font-semibold text-[#0F2147]">
                    {option.label}
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-slate-500">
                    {option.description}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </fieldset>
  );
}