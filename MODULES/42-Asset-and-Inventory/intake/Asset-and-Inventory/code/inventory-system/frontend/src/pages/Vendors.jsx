import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, Building2, Mail, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { vendorApi } from "../api";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

const emptyForm = { companyName: "", contactPerson: "", email: "", phone: "", gstNumber: "", address: "" };

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await vendorApi.list({ search });
      setVendors(data);
    } catch {
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (v) => {
    setEditingId(v._id);
    setForm({
      companyName: v.companyName,
      contactPerson: v.contactPerson,
      email: v.email,
      phone: v.phone,
      gstNumber: v.gstNumber || "",
      address: v.address || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await vendorApi.update(editingId, form);
        toast.success("Vendor updated");
      } else {
        await vendorApi.create(form);
        toast.success("Vendor added");
      }
      setModalOpen(false);
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await vendorApi.remove(deleteId);
      toast.success("Vendor removed");
      setDeleteId(null);
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Vendors"
        subtitle="Manage your suppliers and vendor information."
        actions={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Vendor
          </button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-9 bg-white"
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading vendors...</p>
      ) : vendors.length === 0 ? (
        <p className="text-sm text-gray-400">No vendors found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <div key={v._id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{v.companyName}</p>
                    <p className="text-xs text-gray-400">{v.contactPerson}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(v)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(v._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-gray-500">
                <p className="flex items-center gap-2">
                  <Mail size={13} /> {v.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={13} /> {v.phone}
                </p>
                {v.gstNumber && <p className="text-xs text-gray-400">GST: {v.gstNumber}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Vendor" : "Add Vendor"} width="max-w-xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label-text">Company Name</label>
            <input
              required
              className="input-field"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </div>
          <div>
            <label className="label-text">Contact Person</label>
            <input
              required
              className="input-field"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            />
          </div>
          <div>
            <label className="label-text">Phone Number</label>
            <input
              required
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label-text">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label-text">GST Number</label>
            <input
              className="input-field"
              value={form.gstNumber}
              onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label-text">Address</label>
            <textarea
              rows={2}
              className="input-field"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Vendor"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="This will permanently remove the vendor. Purchase history linked to this vendor will remain."
      />
    </div>
  );
};

export default Vendors;
