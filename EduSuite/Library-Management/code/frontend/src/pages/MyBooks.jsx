import React, { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function MyBooks() {
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const res = await client.get("/my-books");
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    })();
  }, [currentUser]);

  return (
    <div className="p-7">
      <h1 className="text-2xl font-bold text-gray-900 m-0">My Books</h1>
      <p className="text-gray-500 text-sm mt-1">
        {currentUser?.role === "parent"
          ? `Borrowing history for ${data?.student?.name || "your child"}.`
          : "Your own borrowing history, due dates, and any fines owed."}
      </p>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mt-4 text-sm">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left bg-gray-50">
              <th className="py-2.5 px-4 font-medium">Book</th>
              <th className="py-2.5 px-4 font-medium">Issue date</th>
              <th className="py-2.5 px-4 font-medium">Due date</th>
              <th className="py-2.5 px-4 font-medium">Status</th>
              <th className="py-2.5 px-4 font-medium">Fine</th>
            </tr>
          </thead>
          <tbody>
            {(!data || data.records.length === 0) && (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">No borrowing history yet.</td></tr>
            )}
            {data?.records.map((r) => (
              <tr key={r._id} className="border-t border-gray-100">
                <td className="py-2.5 px-4">
                  <span className="mr-1">{r.bookId?.coverEmoji}</span>
                  <span className="font-medium text-gray-900">{r.bookId?.title}</span>
                </td>
                <td className="py-2.5 px-4 text-gray-700">{new Date(r.issueDate).toLocaleDateString("en-IN")}</td>
                <td className="py-2.5 px-4 text-gray-700">{new Date(r.dueDate).toLocaleDateString("en-IN")}</td>
                <td className="py-2.5 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    r.isOverdue ? "bg-red-100 text-red-700" : r.status === "Returned" ? "bg-gray-200 text-gray-700" : "bg-green-100 text-green-700"
                  }`}>
                    {r.isOverdue ? "Overdue" : r.status}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-gray-700">{r.currentFine > 0 ? `₹${r.currentFine}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
