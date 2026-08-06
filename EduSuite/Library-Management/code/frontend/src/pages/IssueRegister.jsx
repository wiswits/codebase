import React, { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import client from "../api/client";
import Modal from "../components/Modal";

export default function IssueRegister() {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("All");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [modal, setModal] = useState(false);
  const [availableCopies, setAvailableCopies] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ copyId: "", userId: "", dueInDays: 14 });
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = {};
      if (filter !== "All") params.status = filter;
      if (overdueOnly) params.overdueOnly = "true";
      const res = await client.get("/issue-register", { params });
      setRecords(res.data.data);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  }, [filter, overdueOnly]);

  useEffect(() => { load(); }, [load]);

  const openIssueModal = async () => {
    try {
      const [copiesRes, usersRes] = await Promise.all([
        client.get("/copies", { params: { status: "Available" } }),
        client.get("/users/demo-users"),
      ]);
      setAvailableCopies(copiesRes.data.data);
      setMembers(usersRes.data.data.filter((u) => ["student", "teacher"].includes(u.role)));
      setModal(true);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  const submitIssue = async () => {
    try {
      const res = await client.post("/issue-register/issue", form);
      setMessage(res.data.message);
      setModal(false);
      setForm({ copyId: "", userId: "", dueInDays: 14 });
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  const returnBook = async (id) => {
    try {
      const res = await client.post(`/issue-register/${id}/return`);
      setMessage(res.data.message);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="p-7">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Issue Register</h1>
          <p className="text-gray-500 text-sm mt-1">Issue and return books in under 30 seconds.</p>
        </div>
        <button onClick={openIssueModal} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Issue book
        </button>
      </div>

      {message && <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg p-3 mb-4 text-sm">{message}</div>}

      <div className="flex gap-2 mb-4 items-center">
        {["All", "Issued", "Returned"].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setOverdueOnly(false); }}
            className={`px-3 py-1.5 rounded-lg text-sm border ${filter === f && !overdueOnly ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => { setOverdueOnly(true); setFilter("Issued"); }}
          className={`px-3 py-1.5 rounded-lg text-sm border ${overdueOnly ? "bg-red-600 text-white border-red-600" : "bg-white text-red-600 border-red-200"}`}
        >
          Overdue only
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left bg-gray-50">
              <th className="py-2.5 px-4 font-medium">Book</th>
              <th className="py-2.5 px-4 font-medium">Member</th>
              <th className="py-2.5 px-4 font-medium">Issue date</th>
              <th className="py-2.5 px-4 font-medium">Due date</th>
              <th className="py-2.5 px-4 font-medium">Status</th>
              <th className="py-2.5 px-4 font-medium">Fine</th>
              <th className="py-2.5 px-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No records found.</td></tr>}
            {records.map((r) => (
              <tr key={r._id} className="border-t border-gray-100">
                <td className="py-2.5 px-4">
                  <span className="mr-1">{r.bookId?.coverEmoji}</span>
                  <span className="font-medium text-gray-900">{r.bookId?.title}</span>
                  <div className="text-xs text-gray-400 font-mono">{r.copyId?.barcode}</div>
                </td>
                <td className="py-2.5 px-4">
                  <div className="text-gray-900">{r.userId?.name}</div>
                  <div className="text-xs text-gray-400">{r.userId?.studentCode || r.userId?.role}</div>
                </td>
                <td className="py-2.5 px-4 text-gray-700">{new Date(r.issueDate).toLocaleDateString("en-IN")}</td>
                <td className="py-2.5 px-4 text-gray-700">{new Date(r.dueDate).toLocaleDateString("en-IN")}</td>
                <td className="py-2.5 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    r.isOverdue ? "bg-red-100 text-red-700" : r.status === "Returned" ? "bg-gray-200 text-gray-700" : "bg-green-100 text-green-700"
                  }`}>
                    {r.isOverdue ? `Overdue (${r.daysOverdue}d)` : r.status}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-gray-700">{r.computedFine > 0 ? `₹${r.computedFine}` : "—"}</td>
                <td className="py-2.5 px-4">
                  {r.status === "Issued" && (
                    <button onClick={() => returnBook(r._id)} className="text-xs text-blue-600 border border-blue-200 px-2.5 py-1 rounded-md">
                      Return
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Issue a book" onClose={() => setModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Available copy</label>
              <select
                value={form.copyId}
                onChange={(e) => setForm({ ...form, copyId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
              >
                <option value="">Select an available copy</option>
                {availableCopies.map((c) => (
                  <option key={c._id} value={c._id}>{c.bookId?.title} — {c.barcode}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Member</label>
              <select
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
              >
                <option value="">Select a student or teacher</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}{m.studentCode ? ` (${m.studentCode})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Loan period (days)</label>
              <input
                type="number"
                value={form.dueInDays}
                onChange={(e) => setForm({ ...form, dueInDays: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
              />
            </div>
            <button onClick={submitIssue} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold mt-2">Issue book</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
