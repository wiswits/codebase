import { useEffect, useState, useCallback } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import toast from "react-hot-toast";
import { reportApi, dashboardApi } from "../api";
import PageHeader from "../components/PageHeader";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";

const reportTypes = [
  { value: "stock", label: "Stock Report" },
  { value: "purchases", label: "Purchase Report" },
  { value: "issues", label: "Issue Report" },
  { value: "returns", label: "Return Report" },
  { value: "vendors", label: "Vendor Report" },
];

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [reportType, setReportType] = useState("stock");
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [generating, setGenerating] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const [sRes, dRes] = await Promise.all([reportApi.summary(), dashboardApi.get()]);
      setSummary(sRes.data);
      setDashboard(dRes.data);
    } catch {
      toast.error("Failed to load report summary");
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      let data = [];
      if (reportType === "stock") {
        const res = await reportApi.stock();
        data = res.data;
      } else if (reportType === "purchases") {
        const res = await reportApi.purchases({ startDate, endDate });
        data = res.data;
      } else if (reportType === "issues") {
        const res = await reportApi.issues({ startDate, endDate });
        data = res.data;
      } else if (reportType === "returns") {
        const res = await reportApi.returns({ startDate, endDate });
        data = res.data;
      } else if (reportType === "vendors") {
        const res = await reportApi.vendors();
        data = res.data;
      }
      setRows(data);
      toast.success("Report generated");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const getColumns = () => {
    switch (reportType) {
      case "stock":
        return [
          { header: "Product", accessor: (r) => r.name },
          { header: "Category", accessor: (r) => r.category?.name || "" },
          { header: "SKU", accessor: (r) => r.sku },
          { header: "Stock", accessor: (r) => r.quantity },
          { header: "Min Stock", accessor: (r) => r.minStock },
          { header: "Status", accessor: (r) => r.status },
        ];
      case "purchases":
        return [
          { header: "Invoice", accessor: (r) => r.invoiceNumber },
          { header: "Vendor", accessor: (r) => r.vendor?.companyName || "" },
          { header: "Items", accessor: (r) => r.items?.length || 0 },
          { header: "Total", accessor: (r) => r.grandTotal },
          { header: "Date", accessor: (r) => new Date(r.purchaseDate).toLocaleDateString("en-IN") },
        ];
      case "issues":
        return [
          { header: "Issued To", accessor: (r) => r.issueTo },
          { header: "Department", accessor: (r) => r.department },
          { header: "Items", accessor: (r) => r.items?.length || 0 },
          { header: "Status", accessor: (r) => r.status },
          { header: "Date", accessor: (r) => new Date(r.issueDate).toLocaleDateString("en-IN") },
        ];
      case "returns":
        return [
          { header: "Product", accessor: (r) => r.product?.name || "" },
          { header: "Quantity", accessor: (r) => r.quantity },
          { header: "Condition", accessor: (r) => r.condition },
          { header: "Date", accessor: (r) => new Date(r.returnDate).toLocaleDateString("en-IN") },
        ];
      case "vendors":
        return [
          { header: "Vendor", accessor: (r) => r.vendor?.companyName || "" },
          { header: "Contact", accessor: (r) => r.vendor?.contactPerson || "" },
          { header: "Total Purchases", accessor: (r) => r.totalPurchases },
          { header: "Total Spent", accessor: (r) => r.totalSpent },
        ];
      default:
        return [];
    }
  };

  const handleExportExcel = () => {
    if (!rows.length) return toast.error("Generate a report first");
    exportToExcel(rows, getColumns(), `${reportType}-report`);
  };

  const handleExportPDF = () => {
    if (!rows.length) return toast.error("Generate a report first");
    const title = reportTypes.find((r) => r.value === reportType)?.label || "Report";
    exportToPDF(rows, getColumns(), title, `${reportType}-report`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Generate and download inventory reports.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input-field w-44" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {reportTypes.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <input type="date" className="input-field w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="input-field w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button className="btn-primary" onClick={generateReport} disabled={generating}>
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-400">Total Products</p>
          <p className="text-xl font-semibold text-gray-800 mt-1">{summary?.totalProducts ?? "-"}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400">Total Stock</p>
          <p className="text-xl font-semibold text-gray-800 mt-1">{summary?.totalStock ?? "-"}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400">Stock Value</p>
          <p className="text-xl font-semibold text-gray-800 mt-1">
            ₹{summary?.totalStockValue?.toLocaleString("en-IN") ?? "-"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400">Low Stock Items</p>
          <p className="text-xl font-semibold text-gray-800 mt-1">{summary?.lowStockItems ?? "-"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Stock by Category</h3>
          {dashboard?.stockByCategoryChart?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dashboard.stockByCategoryChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#7bc491" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">No data yet.</div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top Low Stock Items</h3>
          <div className="space-y-3">
            {dashboard?.lowStockAlerts?.length ? (
              dashboard.lowStockAlerts.map((p) => (
                <div key={p._id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{p.name}</span>
                  <span className="text-gray-400">
                    {p.quantity} / {p.minStock}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No low stock items.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            {reportTypes.find((r) => r.value === reportType)?.label} {rows.length > 0 && `(${rows.length})`}
          </h3>
          <div className="flex gap-2">
            <button className="btn-danger" onClick={handleExportPDF}>
              <FileDown size={16} /> Export PDF
            </button>
            <button className="btn-primary" onClick={handleExportExcel}>
              <FileSpreadsheet size={16} /> Export Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                {getColumns().map((c) => (
                  <th key={c.header} className="table-th">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={getColumns().length} className="table-td text-center text-gray-400 py-8">
                    Click "Generate" to load report data.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={idx}>
                    {getColumns().map((c) => (
                      <td key={c.header} className="table-td">
                        {c.accessor(row)}
                      </td>
                    ))}
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

export default Reports;
