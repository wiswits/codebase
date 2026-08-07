import React, { useEffect, useState, useCallback } from "react";
import { Search, Plus, Trash2, Edit2 } from "lucide-react";
import client from "../api/client";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const emptyForm = { title: "", author: "", isbn: "", category: "", publisher: "", totalCopies: 1, coverEmoji: "📘" };

export default function Books() {
  const { currentUser } = useAuth();
  const canWrite = ["admin", "teacher"].includes(currentUser?.role);
  const canDelete = currentUser?.role === "admin";

  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // 'add' | 'edit'
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await client.get("/books", { params: { search, page, limit: 8 } });
      setBooks(res.data.data.books);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      if (modal === "add") {
        await client.post("/books", form);
        setMessage("Book added to catalog");
      } else {
        await client.put(`/books/${editingId}`, form);
        setMessage("Book updated");
      }
      setModal(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  const openEdit = (book) => {
    setForm({
      title: book.title, author: book.author, isbn: book.isbn || "",
      category: book.category, publisher: book.publisher || "",
      totalCopies: book.totalCopies, coverEmoji: book.coverEmoji,
    });
    setEditingId(book._id);
    setModal("edit");
  };

  const remove = async (id) => {
    try {
      await client.delete(`/books/${id}`);
      setMessage("Book deleted");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="p-7">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Book Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">Search, add, and manage every title in the library.</p>
        </div>
        {canWrite && (
          <button
            onClick={() => { setForm(emptyForm); setModal("add"); }}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={16} /> Add book
          </button>
        )}
      </div>

      {message && (
        <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg p-3 mb-4 text-sm">{message}</div>
      )}

      <div className="relative w-80 mb-4">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by title, author, or ISBN..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left bg-gray-50">
              <th className="py-2.5 px-4 font-medium">Book</th>
              <th className="py-2.5 px-4 font-medium">Author</th>
              <th className="py-2.5 px-4 font-medium">Category</th>
              <th className="py-2.5 px-4 font-medium">Availability</th>
              {canWrite && <th className="py-2.5 px-4 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {books.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">No books found.</td></tr>
            )}
            {books.map((b) => (
              <tr key={b._id} className="border-t border-gray-100">
                <td className="py-2.5 px-4">
                  <span className="mr-2">{b.coverEmoji}</span>
                  <span className="font-medium text-gray-900">{b.title}</span>
                  <div className="text-xs text-gray-400">{b.isbn}</div>
                </td>
                <td className="py-2.5 px-4 text-gray-700">{b.author}</td>
                <td className="py-2.5 px-4">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{b.category}</span>
                </td>
                <td className="py-2.5 px-4 text-gray-700">{b.availabilityLabel}</td>
                {canWrite && (
                  <td className="py-2.5 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="text-blue-600 hover:text-blue-800"><Edit2 size={15} /></button>
                      {canDelete && (
                        <button onClick={() => remove(b._id)} className="text-red-600 hover:text-red-800"><Trash2 size={15} /></button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${p === page ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === "add" ? "Add new book" : "Edit book"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Field label="Author" value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
            <Field label="ISBN" value={form.isbn} onChange={(v) => setForm({ ...form, isbn: v })} />
            <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="Fiction, Academic, Science..." />
            <Field label="Publisher" value={form.publisher} onChange={(v) => setForm({ ...form, publisher: v })} />
            <button onClick={submit} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold mt-2">
              {modal === "add" ? "Add book" : "Save changes"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
      />
    </div>
  );
}
