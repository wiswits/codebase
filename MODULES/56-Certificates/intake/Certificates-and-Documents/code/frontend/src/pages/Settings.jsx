import React, { useState } from 'react';
import { 
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Palette,
  Database,
  Printer,
  Mail,
  Globe,
  Lock,
  Users,
  FileText,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'printers', label: 'Printers', icon: Printer },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'backup', label: 'Backup', icon: Database }
  ];

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings saved successfully');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="text-gray-500 text-sm">Configure your system preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="card sticky top-6">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors
                      ${activeTab === tab.id 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-primary text-lg">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Sunrise Public School"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30">
                      <option>UTC +5:30 (India)</option>
                      <option>UTC +0 (GMT)</option>
                      <option>UTC -5 (EST)</option>
                      <option>UTC -8 (PST)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Format
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-primary text-lg">Security Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="twoFactor" className="w-4 h-4" />
                    <label htmlFor="twoFactor" className="text-sm text-gray-700">
                      Enable Two-Factor Authentication
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="session" className="w-4 h-4" defaultChecked />
                    <label htmlFor="session" className="text-sm text-gray-700">
                      Auto logout after 30 minutes of inactivity
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-primary text-lg">User Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">Admin User</div>
                      <div className="text-sm text-gray-500">admin@sunrise.edu</div>
                    </div>
                    <span className="chip chip-green">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">Coordinator</div>
                      <div className="text-sm text-gray-500">coord@sunrise.edu</div>
                    </div>
                    <span className="chip chip-blue">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">Teacher</div>
                      <div className="text-sm text-gray-500">teacher@sunrise.edu</div>
                    </div>
                    <span className="chip chip-amber">Pending</span>
                  </div>
                  <button className="btn-secondary w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Add New User
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'printers' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-primary text-lg">Printer Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Printer
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30">
                      <option>Main Office Printer</option>
                      <option>Administration Printer</option>
                      <option>Staff Room Printer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Print Quality
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30">
                      <option>Standard</option>
                      <option>High Quality</option>
                      <option>Draft</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="autoPrint" className="w-4 h-4" defaultChecked />
                    <label htmlFor="autoPrint" className="text-sm text-gray-700">
                      Auto-print after generation
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="duplex" className="w-4 h-4" />
                    <label htmlFor="duplex" className="text-sm text-gray-700">
                      Duplex printing (double-sided)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-primary text-lg">Document Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Document Type
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30">
                      <option>Certificate</option>
                      <option>ID Card</option>
                      <option>Bonafide</option>
                      <option>Transfer Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-archive after (days)
                    </label>
                    <input
                      type="number"
                      defaultValue="365"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="autoVerify" className="w-4 h-4" defaultChecked />
                    <label htmlFor="autoVerify" className="text-sm text-gray-700">
                      Auto-verify documents on generation
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="hashVerify" className="w-4 h-4" defaultChecked />
                    <label htmlFor="hashVerify" className="text-sm text-gray-700">
                      Enable hash-based verification
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button - appears for all tabs */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button 
                onClick={handleSave}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;