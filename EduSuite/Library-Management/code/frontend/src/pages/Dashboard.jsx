import React, { useEffect, useState } from "react";
import { BookOpen, Users, IndianRupee, Calendar, AlertTriangle } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import client from "../api/client";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#3b82f6", "#ec4899", "#8b5cf6", "#60a5fa", "#f59e0b", "#10b981"];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [trend, setTrend] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    if (!["admin", "teacher"].includes(currentUser.role)) return;

    (async () => {
      try {
        const [s, reg, cat, tr] = await Promise.all([
          client.get("/stats/summary"),
          client.get("/issue-register"),
          client.get("/stats/category-breakdown"),
          client.get("/stats/issue-return-trend"),
        ]);
        setSummary(s.data.data);
        setRecentIssues(reg.data.data.slice(0, 5));
        setOverdue(reg.data.data.filter((r) => r.isOverdue).sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 3));
        setCategoryData(cat.data.data);
        setTrend(tr.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    })();
  }, [currentUser]);

  if (currentUser && !["admin", "teacher"].includes(currentUser.role)) {
    return (
      <div className="p-7">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {currentUser.name}</h1>
        <p className="text-gray-500 mt-2">
          The full operational dashboard is for admins and teachers. Head to{" "}
          <span className="text-blue-600 font-medium">My Books</span> to see your own borrowing history.
        </p>
      </div>
    );
  }

  const totalBooks = summary?.totalBooks ?? 0;
  const totalCategoryCount = categoryData.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="p-7">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {currentUser?.name}! Here's what's happening in your library.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-3.5 py-2 rounded-lg text-sm text-gray-700">
          <Calendar size={15} />
          {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", weekday: "long" })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error} — make sure the backend is running and seeded (npm run seed).
        </div>
      )}

      {summary?.overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {summary.overdueCount} book(s) are currently overdue — outstanding fines total ₹{summary.outstandingFines}.
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard icon={BookOpen} label="Total Books" value={totalBooks.toLocaleString()} sub="All time" bg="#dbeafe" color="#2563eb" />
        <StatCard
          icon={BookOpen}
          label="Available Books"
          value={(summary?.availableCopies ?? 0).toLocaleString()}
          sub={summary ? `${((summary.availableCopies / (summary.totalCopies || 1)) * 100).toFixed(1)}% of total` : ""}
          bg="#d1fae5" color="#059669"
        />
        <StatCard
          icon={Users}
          label="Issued Books"
          value={(summary?.issuedCopies ?? 0).toLocaleString()}
          sub={summary ? `${((summary.issuedCopies / (summary.totalCopies || 1)) * 100).toFixed(1)}% of total` : ""}
          bg="#fef3c7" color="#d97706"
        />
        <StatCard
          icon={IndianRupee}
          label="Total Fines"
          value={`₹${(summary?.outstandingFines ?? 0).toLocaleString()}.00`}
          sub="Outstanding"
          bg="#fee2e2" color="#dc2626"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Issues</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="py-1.5 font-medium">#</th>
                <th className="py-1.5 font-medium">Book Title</th>
                <th className="py-1.5 font-medium">Member</th>
                <th className="py-1.5 font-medium">Due Date</th>
                <th className="py-1.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentIssues.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-400">No issue records yet.</td></tr>
              )}
              {recentIssues.map((r, i) => (
                <tr key={r._id} className="border-t border-gray-100">
                  <td className="py-2.5 text-gray-500">{i + 1}</td>
                  <td className="py-2.5 font-medium text-gray-900">{r.bookId?.coverEmoji} {r.bookId?.title}</td>
                  <td className="py-2.5">
                    <div className="text-gray-900">{r.userId?.name}</div>
                    <div className="text-xs text-gray-400">{r.userId?.studentCode}</div>
                  </td>
                  <td className="py-2.5 text-gray-700">{new Date(r.dueDate).toLocaleDateString("en-IN")}</td>
                  <td className="py-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.isOverdue ? "bg-red-100 text-red-700" : r.status === "Returned" ? "bg-gray-200 text-gray-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {r.isOverdue ? "Overdue" : r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Overdue Books</h3>
          {overdue.length === 0 && <p className="text-sm text-gray-400">No overdue books right now.</p>}
          {overdue.map((r) => (
            <div key={r._id} className="flex justify-between items-center py-2 border-t border-gray-100 first:border-t-0">
              <div>
                <div className="text-sm font-medium text-gray-900">{r.bookId?.title}</div>
                <div className="text-xs text-gray-500">{r.userId?.name} ({r.userId?.studentCode})</div>
                <div className="text-xs text-red-600">Due: {new Date(r.dueDate).toLocaleDateString("en-IN")}</div>
              </div>
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{r.daysOverdue} days</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Books by Category</h3>
          <div className="flex items-center gap-5">
            <div style={{ width: 160, height: 160 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categoryData} dataKey="count" nameKey="category" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {categoryData.map((c, i) => <Cell key={c.category} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1">
              {categoryData.map((c, i) => (
                <div key={c.category} className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2 text-gray-700">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                    {c.category}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {c.count} ({((c.count / totalCategoryCount) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Issue / Return Overview (last 7 days)</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="issued" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="returned" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
