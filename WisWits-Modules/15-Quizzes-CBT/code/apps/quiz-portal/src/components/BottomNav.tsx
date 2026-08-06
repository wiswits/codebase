"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Library, BarChart3 } from "lucide-react";

const tabs = [
  { href: "/",          label: "Home",       icon: Home,          match: ["/"] },
  { href: "/assessment",label: "Assessment", icon: ClipboardList, match: ["/assessment"] },
  { href: "/bank",      label: "Bank",       icon: Library,       match: ["/bank"] },
  { href: "/analytics", label: "Analytics",  icon: BarChart3,     match: ["/analytics"] },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="qp-bottom-nav" aria-label="Primary">
      <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: 600, margin: '0 auto' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = t.match.some(m => m === '/' ? pathname === '/' : pathname.startsWith(m));
          return (
            <Link key={t.href} href={t.href} className={`qp-nav-item qp-tap${active ? ' active' : ''}`}>
              <span className="qp-nav-icon"><Icon size={20} strokeWidth={2.2}/></span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
