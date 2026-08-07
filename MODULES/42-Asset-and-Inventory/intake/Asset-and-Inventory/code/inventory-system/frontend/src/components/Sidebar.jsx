import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ShoppingCart,
  PackagePlus,
  PackageMinus,
  Undo2,
  History,
  FileBarChart,
  Bell,
  Users,
  Settings,
  Boxes,
} from "lucide-react";

const navSections = [
  {
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    title: "Inventory",
    items: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/categories", label: "Categories", icon: Tags },
      { to: "/vendors", label: "Vendors", icon: Truck },
    ],
  },
  {
    title: "Stock Movement",
    items: [
      { to: "/purchase", label: "Purchase", icon: ShoppingCart },
      { to: "/stock-in", label: "Stock In", icon: PackagePlus },
      { to: "/stock-out", label: "Stock Out / Issue", icon: PackageMinus },
      { to: "/returns", label: "Returns", icon: Undo2 },
      { to: "/inventory-history", label: "Inventory History", icon: History },
    ],
  },
  {
    title: "Insights",
    items: [
      { to: "/reports", label: "Reports", icon: FileBarChart },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/users", label: "Users", icon: Users },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-brand-900 text-brand-50 flex flex-col z-40 transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-brand-400 flex items-center justify-center shrink-0">
            <Boxes size={20} className="text-brand-950" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">Inventory &amp; Assets</p>
            <p className="text-[11px] text-brand-200 truncate">Management System</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section, idx) => (
            <div key={idx}>
              {section.title && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-brand-500 text-white font-medium shadow-sm"
                          : "text-brand-100 hover:bg-white/5"
                      }`
                    }
                  >
                    <Icon size={17} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 text-[11px] text-brand-300">
          © 2024 Inventory System
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
