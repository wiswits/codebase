import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { vendorApi, productApi, purchaseApi } from "../api";
import PageHeader from "../components/PageHeader";

const emptyLine = { product: "", quantity: 1, unitPrice: 0 };

const Purchase = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendor, setVendor] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [vRes, pRes] = await Promise.all([vendorApi.list(), productApi.list({ limit: 500 })]);
        setVendors(vRes.data);
        setProducts(pRes.data.products);
      } catch {
        toast.error("Failed to load vendors/products");
      }
    };
    load();
  }, []);

  const updateLine = (idx, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const total = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendor || !invoiceNumber || lines.some((l) => !l.product)) {
      toast.error("Please fill vendor, invoice number and select a product for every line");
      return;
    }
    setSaving(true);
    try {
      await purchaseApi.create({
        vendor,
        invoiceNumber,
        purchaseDate,
        items: lines.map((l) => ({
          product: l.product,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
      });
      toast.success("Purchase recorded, stock updated");
      navigate("/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save purchase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Purchase Stock" subtitle="Add new stock to your inventory." />

      <form onSubmit={handleSubmit} className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="label-text">Vendor</label>
            <select required className="input-field" value={vendor} onChange={(e) => setVendor(e.target.value)}>
              <option value="">Select vendor</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.companyName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Invoice Number</label>
            <input
              required
              className="input-field"
              placeholder="INV-2025-0713"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="label-text">Purchase Date</label>
            <input
              type="date"
              required
              className="input-field"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                <th className="table-th">Product</th>
                <th className="table-th w-28">Quantity</th>
                <th className="table-th w-32">Unit Price</th>
                <th className="table-th w-32">Total</th>
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
                      onChange={(e) => {
                        const prod = products.find((p) => p._id === e.target.value);
                        updateLine(idx, "product", e.target.value);
                        if (prod) updateLine(idx, "unitPrice", prod.purchasePrice);
                      }}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
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
                      type="number"
                      min="0"
                      className="input-field"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(idx, "unitPrice", e.target.value)}
                    />
                  </td>
                  <td className="table-td font-medium">
                    ₹{((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)).toLocaleString("en-IN")}
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
          <p className="text-lg font-semibold text-gray-800">
            Grand Total: ₹{total.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Purchase"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Purchase;
