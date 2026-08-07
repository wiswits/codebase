import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Coins, AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { dashboardApi } from "../api";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#2f8a52", "#7bc491", "#f0b429", "#3b82f6", "#a855f7"];

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await dashboardApi.get();
        setData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-400">Loading dashboard...</div>;
  }

  const stats = data || {};

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Welcome back, {user?.name?.split(" ")[0]}! Here's what's happening with your inventory.
          </p>
        </div>
        <div className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 bg-white">
          {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Products"
          value={stats.totalProducts?.toLocaleString() ?? "0"}
          sub="Across all categories"
          icon={Package}
          iconBg="#eaf5ee"
          iconColor="#2f8a52"
        />
        <StatCard
          label="Total Stock Value"
          value={formatCurrency(stats.totalStockValue)}
          sub="At purchase price"
          icon={Coins}
          iconBg="#fef3e2"
          iconColor="#e08e0b"
        />
        <StatCard
          label="Low Stock Items"
          value={stats.lowStockCount ?? 0}
          sub="Needs reordering"
          icon={AlertTriangle}
          iconBg="#fdeaea"
          iconColor="#e0483b"
        />
        <StatCard
          label="Out of Stock"
          value={stats.outOfStockCount ?? 0}
          sub="Unavailable items"
          icon={XCircle}
          iconBg="#f1eafd"
          iconColor="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Stock Movement Overview</h3>
          </div>
          {stats.stockOverview?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.stockOverview}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f8a52" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2f8a52" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="net" stroke="#2f8a52" fill="url(#colorNet)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
              Not enough transaction data yet.
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {stats.recentTransactions?.length ? (
              stats.recentTransactions.map((t) => (
                <div key={t._id} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      t.action === "Stock Out" ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
                    }`}
                  >
                    {t.action === "Stock Out" ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 truncate">
                      {t.action} — {t.product?.name || "Product"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      t.action === "Stock Out" ? "text-red-500" : "text-green-600"
                    }`}
                  >
                    {t.action === "Stock Out" ? "-" : "+"}
                    {t.quantity}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No transactions yet.</p>
            )}
          </div>
          <Link
            to="/inventory-history"
            className="block text-center text-sm text-brand-700 font-medium mt-4 hover:underline"
          >
            View All
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top Categories</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="45%" height={160}>
              <PieChart>
                <Pie
                  data={stats.topCategories || []}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {(stats.topCategories || []).map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {(stats.topCategories || []).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    {c.name}
                  </span>
                  <span className="text-gray-400">{c.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Low Stock Alerts</h3>
            <Link to="/products?status=Low+Stock" className="text-sm text-brand-700 font-medium hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.lowStockAlerts?.length ? (
              stats.lowStockAlerts.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        Stock: {p.quantity} (Min: {p.minStock})
                      </p>
                    </div>
                  </div>
                  <span className="badge bg-amber-50 text-amber-700">Low Stock</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 py-3">No low stock alerts right now.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
