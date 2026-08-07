import { useEffect, useState, useCallback } from "react";
import { Bell, AlertTriangle, XCircle, Clock, CheckCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { notificationApi } from "../api";
import PageHeader from "../components/PageHeader";

const iconFor = (type) => {
  if (type === "Out of Stock") return { icon: XCircle, bg: "#fdeaea", color: "#e0483b" };
  if (type === "Low Stock") return { icon: AlertTriangle, bg: "#fef3e2", color: "#e08e0b" };
  if (type === "Pending Return") return { icon: Clock, bg: "#eaf0fd", color: "#3b82f6" };
  return { icon: Bell, bg: "#eaf5ee", color: "#2f8a52" };
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationApi.list();
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      toast.error("Failed to update notification");
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  const remove = async (id) => {
    try {
      await notificationApi.remove(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      toast.error("Failed to remove notification");
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Stay updated on low stock, out of stock and pending returns."
        actions={
          <button className="btn-secondary" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark All Read
          </button>
        }
      />

      <div className="card divide-y divide-gray-100">
        {loading ? (
          <p className="text-sm text-gray-400 p-6">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Bell size={28} className="mx-auto mb-2 text-gray-300" />
            You're all caught up.
          </div>
        ) : (
          notifications.map((n) => {
            const { icon: Icon, bg, color } = iconFor(n.type);
            return (
              <div key={n._id} className={`flex items-start gap-3 p-4 ${!n.isRead ? "bg-brand-50/30" : ""}`}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(n.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n._id)}
                      className="text-xs text-brand-700 font-medium hover:underline whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                  <button onClick={() => remove(n._id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
