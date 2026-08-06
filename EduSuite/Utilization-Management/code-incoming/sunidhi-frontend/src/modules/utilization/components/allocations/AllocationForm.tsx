// src/modules/utilization/components/allocations/AllocationForm.tsx
//
// Frontend validation here is for UX only — backend validation remains
// authoritative. Business rules mirrored from the contract's "BUSINESS
// RULES" section: dates must not conflict, capacity >= allocated hours,
// archived employees cannot receive new allocations (enforced server-
// side / in the mock service, surfaced here as submitError).

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useAllocation } from "../../hooks/useAllocation";
import { utilizationApi } from "../../services/utilizationApi";
import { AllocationInput, Employee, ProjectSummary } from "../../types/utilization.types";

const emptyForm: AllocationInput = {
  employeeId: 0,
  projectId: 0,
  allocationPercent: 0,
  workingHours: 0,
  startDate: "",
  endDate: "",
  remarks: "",
};

export default function AllocationForm() {
  const router = useRouter();
  const { submitting, submitError, create } = useAllocation();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [form, setForm] = useState<AllocationInput>(emptyForm);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    utilizationApi.getEmployees({ page: 1, limit: 100 }).then((r) => setEmployees(r.items));
    utilizationApi.getProjectOptions().then(setProjects);
  }, []);

  const setField = <K extends keyof AllocationInput>(key: K, value: AllocationInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedEmployee = employees.find((e) => e.id === form.employeeId);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.employeeId) errors.employeeId = "Select an employee.";
    if (selectedEmployee?.employmentStatus === "archived") {
      errors.employeeId = "Archived employees cannot receive new allocations.";
    }
    if (!form.projectId) errors.projectId = "Select a project.";
    if (form.allocationPercent <= 0 || form.allocationPercent > 100) {
      errors.allocationPercent = "Allocation % must be between 1 and 100.";
    }
    if (form.workingHours <= 0) errors.workingHours = "Working hours must be greater than 0.";
    if (selectedEmployee && form.workingHours > selectedEmployee.weeklyCapacityHours) {
      errors.workingHours = `Cannot exceed weekly capacity (${selectedEmployee.weeklyCapacityHours} hrs).`;
    }
    if (!form.startDate) errors.startDate = "Start date is required.";
    if (!form.endDate) errors.endDate = "End date is required.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errors.endDate = "End date must be after start date.";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await create(form);
    if (result) {
      router.push(`/utilization/allocations/${result.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">New Allocation</h1>

      <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <Field label="Employee" error={validationErrors.employeeId} full>
          <select
            value={form.employeeId || ""}
            onChange={(e) => setField("employeeId", Number(e.target.value))}
            className={inputClass(Boolean(validationErrors.employeeId))}
          >
            <option value="">Select an employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeName} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Project" error={validationErrors.projectId} full>
          <select
            value={form.projectId || ""}
            onChange={(e) => setField("projectId", Number(e.target.value))}
            className={inputClass(Boolean(validationErrors.projectId))}
          >
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Allocation %" error={validationErrors.allocationPercent}>
          <input
            type="number"
            min={1}
            max={100}
            value={form.allocationPercent}
            onChange={(e) => setField("allocationPercent", Number(e.target.value))}
            className={inputClass(Boolean(validationErrors.allocationPercent))}
          />
        </Field>

        <Field label="Working Hours / Week" error={validationErrors.workingHours}>
          <input
            type="number"
            min={1}
            value={form.workingHours}
            onChange={(e) => setField("workingHours", Number(e.target.value))}
            className={inputClass(Boolean(validationErrors.workingHours))}
          />
        </Field>

        <Field label="Start Date" error={validationErrors.startDate}>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setField("startDate", e.target.value)}
            className={inputClass(Boolean(validationErrors.startDate))}
          />
        </Field>

        <Field label="End Date" error={validationErrors.endDate}>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setField("endDate", e.target.value)}
            className={inputClass(Boolean(validationErrors.endDate))}
          />
        </Field>

        <Field label="Remarks (optional)" full>
          <textarea
            value={form.remarks}
            onChange={(e) => setField("remarks", e.target.value)}
            rows={3}
            className={inputClass(false)}
          />
        </Field>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#0F2147] px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:opacity-90"
        >
          {submitting ? "Saving…" : "Create Allocation"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-400"
      : "border-gray-200 focus:border-[#0F2147] focus:ring-[#0F2147]"
  }`;
}

function Field({
  label,
  error,
  full,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-gray-500 ${full ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
      {error && <span className="text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}
