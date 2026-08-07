import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import client from "../api/client";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  Available: "bg-green-100 text-green-700",
  Issued: "bg-blue-100 text-blue-700",
  Lost: "bg-red-100 text-red-700",
  Damaged: "bg-amber-100 text-amber-700",
};

export default function BookCopies() {
  const { currentUser } = useAuth();
  const canWrite = ["admin", "teacher"].includes(currentUser?.role);
  const canDelete = currentUser?.role === "admin";

  const [copies, setCopies] = useState([]);
  const [books, setBooks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ bookId: "", barcode: "" });
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const [copiesRes, booksRes] = await Promise.all([
        client.get("/copies", { params }),
        client.get("/books", { params: { limit: 100 } }),
      ]);
      setCopies(copiesRes.data.data);
      setBooks(booksRes.data.data.books);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const addCopy = async () => {
    try {
      await client.post("/copies", form);
      setMessage("Copy added");
      setModal(false);
      setForm({ bookId: "", barcode: "" });
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  const setStatus = async (id, status) => {
    try {
      await client.patch(`/copies/${id}/status`, { status });
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  const remove = async (id) => {
    try {
      await client.delete(`/copies/${id}`);
      setMessage("Copy deleted");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="p-7">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Book Copies</h1>
          <p className="text-gray-500 text-sm mt-1">Track every physical copy — availability, lost, and damaged status.</p>
        </div>
        {canWrite && (
          <button onClick={() => setModal(true)} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Add copy
          </button>
        )}
      </div>

      {message && <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg p-3 mb-4 text-sm">{message}</div>}

      <div className="flex gap-2 mb-4">
        {["", "Available", "Issued", "Lost", "Damaged"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${statusFilter === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left bg-gray-50">
              <th className="py-2.5 px-4 font-medium">Barcode</th>
              <th className="py-2.5 px-4 font-medium">Book</th>
              <th className="py-2.5 px-4 font-medium">Status</th>
              {canWrite && <th className="py-2.5 px-4 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {copies.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400">No copies found.</td></tr>}
            {copies.map((c) => (
              <tr key={c._id} className="border-t border-gray-100">
                <td className="py-2.5 px-4 font-mono text-gray-700">{c.barcode}</td>
                <td className="py-2.5 px-4">
                  <span className="mr-1">{c.bookId?.coverEmoji}</span>
                  <span className="font-medium text-gray-900">{c.bookId?.title}</span>
                </td>
                <td className="py-2.5 px-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span></td>
                {canWrite && (
                  <td className="py-2.5 px-4">
                    <div className="flex gap-2 items-center">
                      {c.status !== "Issued" && (
                        <select
                          value={c.status}
                          onChange={(e) => setStatus(c._id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-md px-2 py-1"
                        >
                          <option value="Available">Available</option>
                          <option value="Lost">Lost</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      )}
                      {canDelete && c.status !== "Issued" && (
                        <button onClick={() => remove(c._id)} className="text-red-600 hover:text-red-800"><Trash2 size={15} /></button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Add book copy" onClose={() => setModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Book</label>
              <select
                value={form.bookId}
                onChange={(e) => setForm({ ...form, bookId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
              >
                <option value="">Select a book</option>
                {books.map((b) => <option key={b._id} value={b._id}>{b.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Barcode</label>
              <input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="e.g. BC-00099"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
              />
            </div>
            <button onClick={addCopy} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold mt-2">Add copy</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
