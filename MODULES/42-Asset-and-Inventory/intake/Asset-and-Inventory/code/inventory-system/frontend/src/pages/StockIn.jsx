import { useEffect, useState, useCallback } from "react";
import { PackagePlus } from "lucide-react";
import toast from "react-hot-toast";
import { productApi, stockInApi } from "../api";
import PageHeader from "../components/PageHeader";

const StockIn = () => {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, hRes] = await Promise.all([productApi.list({ limit: 500 }), stockInApi.history()]);
      setProducts(pRes.data.products);
      setHistory(hRes.data);
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
    if (!productId || !quantity) {
      toast.error("Select a product and quantity");
      return;
    }
    setSaving(true);
    try {
      await stockInApi.create({ productId, quantity: Number(quantity), note });
      toast.success("Stock updated");
      setProductId("");
      setQuantity(1);
      setNote("");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Stock In" subtitle="Add extra stock directly without a vendor purchase record." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={handleSubmit} className="card p-5 lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-4 text-brand-700">
            <PackagePlus size={18} />
            <h3 className="font-semibold">Add Stock</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label-text">Product</label>
              <select required className="input-field" value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (current: {p.quantity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Quantity to Add</label>
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
              <label className="label-text">Note (optional)</label>
              <textarea rows={3} className="input-field" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
              {saving ? "Updating..." : "Update Stock"}
            </button>
          </div>
        </form>

        <div className="card lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Stock In History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/60">
                  <th className="table-th">Product</th>
                  <th className="table-th">Quantity Added</th>
                  <th className="table-th">Note</th>
                  <th className="table-th">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="table-td text-center text-gray-400 py-8">
                      Loading...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-td text-center text-gray-400 py-8">
                      No stock-in records yet.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h._id}>
                      <td className="table-td font-medium text-gray-800">{h.product?.name}</td>
                      <td className="table-td text-green-600 font-medium">+{h.quantity}</td>
                      <td className="table-td text-gray-500">{h.note}</td>
                      <td className="table-td text-gray-500">
                        {new Date(h.createdAt).toLocaleDateString("en-IN")}
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

export default StockIn;
