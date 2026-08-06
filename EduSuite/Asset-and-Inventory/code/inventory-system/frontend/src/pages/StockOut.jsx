import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { productApi, stockOutApi } from "../api";
import PageHeader from "../components/PageHeader";

const emptyLine = { product: "", quantity: 1, remarks: "" };

const StockOut = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [issueTo, setIssueTo] = useState("");
  const [department, setDepartment] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await productApi.list({ limit: 500 });
        setProducts(data.products);
      } catch {
        toast.error("Failed to load products");
      }
    };
    load();
  }, []);

  const updateLine = (idx, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const availableFor = (id) => products.find((p) => p._id === id)?.quantity ?? "-";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issueTo || !department || lines.some((l) => !l.product)) {
      toast.error("Please fill issue details and select a product for every line");
      return;
    }
    setSaving(true);
    try {
      await stockOutApi.create({
        issueTo,
        department,
        issueDate,
        items: lines.map((l) => ({ product: l.product, quantity: Number(l.quantity), remarks: l.remarks })),
      });
      toast.success("Items issued, stock updated");
      navigate("/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to issue items");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Stock Out / Issue" subtitle="Issue items to employees, departments or locations." />

      <form onSubmit={handleSubmit} className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="label-text">Issue To</label>
            <input
              required
              className="input-field"
              placeholder="Employee / location name"
              value={issueTo}
              onChange={(e) => setIssueTo(e.target.value)}
            />
          </div>
          <div>
            <label className="label-text">Department</label>
            <input
              required
              className="input-field"
              placeholder="IT Department, Lab..."
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div>
            <label className="label-text">Issue Date</label>
            <input
              type="date"
              required
              className="input-field"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                <th className="table-th">Product</th>
                <th className="table-th w-24">Available</th>
                <th className="table-th w-28">Quantity</th>
                <th className="table-th">Remarks</th>
                <th className="table-th w-12" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td className="table-td">
                    <select
                      required
                      className="input-field"
                      value={line.product}
                      onChange={(e) => updateLine(idx, "product", e.target.value)}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="table-td text-gray-500">{availableFor(line.product)}</td>
                  <td className="table-td">
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                    />
                  </td>
                  <td className="table-td">
                    <input
                      className="input-field"
                      placeholder="e.g. For Lab Use"
                      value={line.remarks}
                      onChange={(e) => updateLine(idx, "remarks", e.target.value)}
                    />
                  </td>
                  <td className="table-td">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={addLine} className="btn-secondary mb-6">
          <Plus size={16} /> Add Product
        </button>

        <div className="flex items-center justify-between border-t border-gray-100 pt-5">
          <p className="text-sm text-gray-500">
            Total Items: <span className="font-medium text-gray-700">{lines.length}</span>
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Issuing..." : "Issue Items"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StockOut;
