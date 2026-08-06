import { useState } from "react";
import toast from "react-hot-toast";
import { userApi } from "../api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

const Settings = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, phone };
      if (password) payload.password = password;
      await userApi.update(user._id, payload);
      const stored = JSON.parse(localStorage.getItem("iams_user"));
      localStorage.setItem("iams_user", JSON.stringify({ ...stored, name }));
      toast.success("Profile updated. Refresh to see all changes.");
      setPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile and account preferences." />

      <div className="card p-6 max-w-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-2xl font-semibold">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label-text">Full Name</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label-text">Email</label>
            <input className="input-field bg-gray-50" value={user?.email} disabled />
          </div>
          <div>
            <label className="label-text">Phone</label>
            <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="label-text">New Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Leave blank to keep current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
