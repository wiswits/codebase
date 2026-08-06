// src/modules/utilization/components/employees/EmployeeProfile.tsx
//
// Full employee profile page — details, current allocations, capacity
// snapshot, and combined timeline. Pulls allocation/capacity data
// separately from useEmployee since those belong to other endpoints
// ("ALLOCATION ENDPOINTS" / capacity reads).

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useEmployee } from "../../hooks/useEmployee";
import { utilizationApi } from "../../services/utilizationApi";
import { Allocation, BenchRecord, CapacityPlan } from "../../types/utilization.types";
import EmployeeDetails from "./EmployeeDetails";
import EmployeeAllocation from "./EmployeeAllocation";
import EmployeeCapacity from "./EmployeeCapacity";
import EmployeeTimeline from "./EmployeeTimeline";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";

interface EmployeeProfileProps {
  employeeId: number;
}

export default function EmployeeProfile({ employeeId }: EmployeeProfileProps) {
  const router = useRouter();
  const { employee, loading, error, refetch } = useEmployee(employeeId);

  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [capacityPlan, setCapacityPlan] = useState<CapacityPlan | null>(null);
  const [benchRecords, setBenchRecords] = useState<BenchRecord[]>([]);

  useEffect(() => {
    utilizationApi.getAllocationsForEmployee(employeeId).then(setAllocations);
    utilizationApi
      .getCapacityPlans({ search: "", page: 1, limit: 50 })
      .then((result) =>
        setCapacityPlan(result.items.find((c) => c.employeeId === employeeId) || null)
      );
    utilizationApi
      .getBenchRecords({ search: "", page: 1, limit: 50 })
      .then((result) => setBenchRecords(result.items.filter((b) => b.employeeId === employeeId)));
  }, [employeeId]);

  if (loading) return <LoadingState rows={3} label="Loading employee profile" />;

  if (error) {
    return <ErrorState title="Unable to load this employee" message={error} onRetry={refetch} />;
  }

  if (!employee) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => router.push(`/utilization/employees/${employee.id}/edit`)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#0F2147] hover:text-[#0F2147]"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>

      <EmployeeDetails employee={employee} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Current Allocations</h3>
          <EmployeeAllocation allocations={allocations.filter((a) => a.status === "active")} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Capacity Snapshot</h3>
          <EmployeeCapacity plan={capacityPlan} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Timeline</h3>
        <EmployeeTimeline allocations={allocations} benchRecords={benchRecords} />
      </div>
    </div>
  );
}
