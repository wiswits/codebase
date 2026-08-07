"use client";

import type { Student } from "../../types/observation.types";

interface StudentSelectorProps {
  students: Student[];
  value: number | null;
  disabled?: boolean;
  error?: string;
  onChange: (studentId: number) => void;
}

export default function StudentSelector({
  students,
  value,
  disabled = false,
  error,
  onChange,
}: StudentSelectorProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="student"
        className="block text-sm font-semibold text-[#0F2147]"
      >
        Student <span className="text-red-600">*</span>
      </label>

      <select
        id="student"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-[#0F2147] outline-none transition focus:border-[#C8A04E] focus:ring-2 focus:ring-[#C8A04E]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="">Select a student</option>

        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name} — {student.studentCode} —{" "}
            {student.className} {student.sectionName}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}