// src/modules/utilization/components/bench/BenchList.tsx
//
// Searchable, filterable bench list with analytics, an add-record
// form, and the required loading/empty/error states. Closing a
// record uses the shared ConfirmDialog (no browser confirm()).

"use client";

import { useState } from "react";
import { AlertCircle, UserPlus } from "lucide-react";
import { useBench } from "../../hooks/useBench";
import { MOCK_EMPLOYEES } from "../../mocks/utilization.mock";
import { BenchRecordInput } from "../../types/utilization.types";
import BenchFilters from "./BenchFilters";
import BenchAnalytics from "./BenchAnalytics";
import BenchTable from "./BenchTable";
import Pagination from "../common/Pagination";
import LoadingState from "../common/LoadingState";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";
import ConfirmDialog from "../common/ConfirmDialog";

const emptyForm: BenchRecordInput = {
  employeeId: 0,
  benchStartDate: "",
  benchReason: "",
  availableDate: "",
  suggestedAllocation: "",
};

export default function BenchList() {
  const {
    items,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    setPage,
    refetch,
    submitting,
    submitError,
    addRecord,
    closeRecord,
  } = useBench();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<BenchRecordInput>(emptyForm);
  const [closeTargetId, setCloseTargetId] = useState<number | null>(null);

  const hasActiveFilters = Boolean(filters.search || filters.status || filters.departmentId);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await addRecord(form);
    if (created) {
      setFormOpen(false);
      setForm(emptyForm);
    }
  };

  const targetRecord = items.find((i) => i.id === closeTargetId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Bench Management</h1>
          <p className="text-sm text-gray-500">
            Track employees without active allocation and plan their next assignment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-[#0F2147] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          {formOpen ? "Close" : "Add to Bench"}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Employee
            <select
              value={form.employeeId || ""}
              onChange={(e) => setForm((p) => ({ ...p, employeeId: Number(e.target.value) }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
            >
              <option value="">Select an employee</option>
              {MOCK_EMPLOYEES.filter((e) => e.employmentStatus !== "archived").map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Available Date
            <input
              type="date"
              value={form.availableDate}
              onChange={(e) => setForm((p) => ({ ...p, availableDate: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 sm:col-span-2">
            Bench Start Date
            <input
              type="date"
              value={form.benchStartDate}
              onChange={(e) => setForm((p) => ({ ...p, benchStartDate: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 sm:col-span-2">
            Reason
            <textarea
              value={form.benchReason}
              onChange={(e) => setForm((p) => ({ ...p, benchReason: e.target.value }))}
              rows={2}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 sm:col-span-2">
            Suggested Allocation (optional)
            <input
              type="text"
              value={form.suggestedAllocation}
              onChange={(e) => setForm((p) => ({ ...p, suggestedAllocation: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
            />
          </label>

          {submitError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting || !form.employeeId}
              className="rounded-lg bg-[#0F2147] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:opacity-90"
            >
              {submitting ? "Saving…" : "Add to Bench"}
            </button>
          </div>
        </form>
      )}

      {!loading && !error && <BenchAnalytics records={items} />}

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-gray-500 sm:max-w-xs">
            Search
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Search by employee"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
            />
          </label>
          <BenchFilters
            filters={{ status: filters.status ?? "", departmentId: filters.departmentId ?? "" }}
            onChange={updateFilters}
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="self-end text-xs font-medium text-gray-500 hover:text-[#0F2147]"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        {loading && <LoadingState label="Loading bench records" />}

        {!loading && error && (
          <ErrorState title="Unable to load bench records" message={error} onRetry={refetch} />
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={hasActiveFilters ? "No bench records match these filters" : "No one is on the bench"}
            description={
              hasActiveFilters
                ? "Try adjusting or clearing your search and filters."
                : "Employees without active allocation will appear here."
            }
          />
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <BenchTable items={items} onClose={(id) => setCloseTargetId(id)} />
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="records" />
          </>
        )}
      </div>

      {targetRecord && (
        <ConfirmDialog
          title="Close this bench record?"
          message={`${targetRecord.employeeName} will be marked as no longer on the bench.`}
          confirmLabel={submitting ? "Closing…" : "Close Record"}
          submitting={submitting}
          onCancel={() => setCloseTargetId(null)}
          onConfirm={async () => {
            await closeRecord(targetRecord.id);
            setCloseTargetId(null);
          }}
        />
      )}
    </div>
  );
}
