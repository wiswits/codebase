import { useEffect, useState, useCallback } from "react";
import { Undo2 } from "lucide-react";
import toast from "react-hot-toast";
import { productApi, returnApi } from "../api";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const Returns = () => {
  const [products, setProducts] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState("Good");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([productApi.list({ limit: 500 }), returnApi.list()]);
      setProducts(pRes.data.products);
      setReturns(rRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product || !quantity) {
      toast.error("Select a product and quantity");
      return;
    }
    setSaving(true);
    try {
      await returnApi.create({ product, quantity: Number(quantity), condition, remarks });
      toast.success("Return recorded");
      setProduct("");
      setQuantity(1);
      setCondition("Good");
      setRemarks("");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record return");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Returns" subtitle="Record returned items and update inventory automatically." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={handleSubmit} className="card p-5 lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-4 text-brand-700">
            <Undo2 size={18} />
            <h3 className="font-semibold">Record a Return</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label-text">Product</label>
              <select required className="input-field" value={product} onChange={(e) => setProduct(e.target.value)}>
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Quantity</label>
              <input
                type="number"
                min="1"
                required
                className="input-field"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="label-text">Condition</label>
              <select className="input-field" value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="Good">Good</option>
                <option value="Damaged">Damaged</option>
                <option value="Needs Repair">Needs Repair</option>
              </select>
            </div>
            <div>
              <label className="label-text">Remarks (optional)</label>
              <textarea rows={3} className="input-field" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
              {saving ? "Saving..." : "Record Return"}
            </button>
          </div>
        </form>

        <div className="card lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Return History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/60">
                  <th className="table-th">Product</th>
                  <th className="table-th">Quantity</th>
                  <th className="table-th">Condition</th>
                  <th className="table-th">Remarks</th>
                  <th className="table-th">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="table-td text-center text-gray-400 py-8">
                      Loading...
                    </td>
                  </tr>
                ) : returns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-td text-center text-gray-400 py-8">
                      No returns recorded yet.
                    </td>
                  </tr>
                ) : (
                  returns.map((r) => (
                    <tr key={r._id}>
                      <td className="table-td font-medium text-gray-800">{r.product?.name}</td>
                      <td className="table-td">{r.quantity}</td>
                      <td className="table-td">
                        <StatusBadge status={r.condition} />
                      </td>
                      <td className="table-td text-gray-500">{r.remarks || "—"}</td>
                      <td className="table-td text-gray-500">
                        {new Date(r.returnDate).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Returns;
