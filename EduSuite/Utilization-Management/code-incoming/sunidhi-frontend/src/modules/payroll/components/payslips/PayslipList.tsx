// src/modules/payroll/components/payslips/PayslipList.tsx

"use client";

import { useRouter } from "next/navigation";
import { usePayslips } from "../../hooks/usePayslips";
import { formatMoney } from "../../constants/payroll.constants";
import { PayslipStatus } from "../../types/payroll.types";
import PayslipStatusBadge from "./PayslipStatusBadge";
import LoadingState from "../common/LoadingState";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";

export default function PayslipList() {
  const router = useRouter();
  const {
    items,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refetch,
  } = usePayslips();

  const hasActiveFilters = Boolean(filters.search || filters.status);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Payslips</h1>
        <p className="text-sm text-gray-500">View and download employee payslips.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            placeholder="Search by employee name"
            className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Status
            <select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value as PayslipStatus | "" })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="generated">Generated</option>
            </select>
          </label>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="self-end text-xs font-medium text-gray-500 hover:text-blue-600"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        {loading && <LoadingState label="Loading payslips" />}

        {!loading && error && (
          <ErrorState title="Unable to load payslips" message={error} onRetry={refetch} />
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={hasActiveFilters ? "No payslips match these filters" : "No payslips yet"}
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Final Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.employeeName}</td>
                    <td className="px-4 py-3 text-gray-600">{p.payrollPeriod}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      ₹{formatMoney(p.finalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <PayslipStatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(`/hr/payroll/payslips/${p.id}`)}
                        className="rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
