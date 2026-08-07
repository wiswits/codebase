import { useEffect, useState, useCallback } from "react";
import { History, ArrowUpRight, ArrowDownRight } from "lucide-react";
import toast from "react-hot-toast";
import { historyApi } from "../api";
import PageHeader from "../components/PageHeader";

const actions = ["All", "Purchase", "Stock In", "Stock Out", "Return", "Adjustment"];

const InventoryHistory = () => {
  const [records, setRecords] = useState([]);
  const [action, setAction] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await historyApi.list({ action: action !== "All" ? action : undefined });
      setRecords(data);
    } catch {
      toast.error("Failed to load inventory history");
    } finally {
      setLoading(false);
    }
  }, [action]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const isInbound = (a) => ["Purchase", "Stock In", "Return"].includes(a);

  return (
    <div>
      <PageHeader title="Inventory History" subtitle="Complete transaction log of all stock movements." />

      <div className="card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 overflow-x-auto">
          {actions.map((a) => (
            <button
              key={a}
              onClick={() => setAction(a)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                action === a ? "bg-brand-700 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                <th className="table-th">Product</th>
                <th className="table-th">User</th>
                <th className="table-th">Action</th>
                <th className="table-th">Quantity</th>
                <th className="table-th">Note</th>
                <th className="table-th">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="table-td text-center text-gray-400 py-8">
                    Loading history...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-td text-center text-gray-400 py-8">
                    <History size={24} className="mx-auto mb-2 text-gray-300" />
                    No records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/50">
                    <td className="table-td font-medium text-gray-800">{r.product?.name || "—"}</td>
                    <td className="table-td text-gray-500">{r.user?.name || "System"}</td>
                    <td className="table-td">
                      <span className="flex items-center gap-1.5">
                        {isInbound(r.action) ? (
                          <ArrowUpRight size={14} className="text-green-600" />
                        ) : (
                          <ArrowDownRight size={14} className="text-red-500" />
                        )}
                        {r.action}
                      </span>
                    </td>
                    <td className={`table-td font-medium ${isInbound(r.action) ? "text-green-600" : "text-red-500"}`}>
                      {isInbound(r.action) ? "+" : "-"}
                      {r.quantity}
                    </td>
                    <td className="table-td text-gray-500">{r.note || "—"}</td>
                    <td className="table-td text-gray-500">
                      {new Date(r.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryHistory;
