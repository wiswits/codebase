// src/modules/payroll/components/adjustments/AdjustmentDetail.tsx
//
// Contract Section 22 lists "Adjustment details" as its own screen,
// distinct from the list. This renders either a single Deduction or
// a single Arrear — same shape, different title field — without
// duplicating a near-identical component for each.

import { formatMoney } from "../../constants/payroll.constants";
import { Arrear, Deduction } from "../../types/payroll.types";

type AdjustmentDetailProps =
  | { kind: "deduction"; item: Deduction; onClose: () => void }
  | { kind: "arrear"; item: Arrear; onClose: () => void };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdjustmentDetail(props: AdjustmentDetailProps) {
  const { kind, item, onClose } = props;
  const title = kind === "deduction" ? item.deductionTitle : item.arrearTitle;
  const kindLabel = kind === "deduction" ? "Deduction" : "Arrear";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {kindLabel} Detail
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-gray-800">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-gray-500 hover:text-blue-600"
        >
          Close
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Employee</dt>
          <dd className="mt-0.5 text-gray-700">{item.employeeName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Amount</dt>
          <dd className="mt-0.5 font-medium text-gray-800">₹{formatMoney(item.amount)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Reason</dt>
          <dd className="mt-0.5 text-gray-700">{item.reason}</dd>
        </div>
        {item.notes && (
          <div className="col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Notes</dt>
            <dd className="mt-0.5 text-gray-700">{item.notes}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Created By</dt>
          <dd className="mt-0.5 text-gray-700">{item.createdBy}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Created On</dt>
          <dd className="mt-0.5 text-gray-700">{formatDate(item.createdAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
