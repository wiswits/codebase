"use client";
// Shared presentational helpers for the Settings surfaces.
// Extracted from the original admin/settings page so that superadmin/settings
// (and the module-first SettingsPage) can reuse them without importing a route
// page — the route page is now a redirect to /settings. Behaviour is verbatim.
import { readableOn, relLuminance } from "@/contexts/OrgContext";
import { Save, Check } from "lucide-react";

export function Field({ label, value, onChange, hint, type = "text" }: { label: string; value: string; onChange: (v: string) => void; hint?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

const BRAND_PRESETS = [
  { name: "WisWits Navy", c: "var(--surface-navy)" }, { name: "Royal Blue", c: "#1E3A8A" },
  { name: "Emerald", c: "#065F46" }, { name: "Maroon", c: "#7F1D1D" },
  { name: "Indigo", c: "#3730A3" }, { name: "Teal", c: "#0F766E" },
  { name: "Purple", c: "#5B21B6" }, { name: "Charcoal", c: "#1E293B" },
];

export function BrandColorSection({ org, updateOrg, absUrl }: any) {
  const brand = /^#[0-9a-fA-F]{6}$/.test(org.brand_color || "") ? org.brand_color : "var(--surface-navy)";
  const onText = readableOn(brand);
  const light = relLuminance(brand) > 0.55;
  const grad = `linear-gradient(120deg, ${brand}, color-mix(in srgb, ${brand}, ${light ? "#000" : "#fff"} 26%))`;
  const dim = (a: number) => `color-mix(in srgb, ${onText} ${a}%, transparent)`;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Brand Color <span className="text-gray-400 font-normal">— powers your sidebar, header & primary buttons</span>
        </label>
        <div className="flex items-center gap-2">
          <input type="color" value={brand} onChange={(e) => updateOrg("brand_color", e.target.value)}
            className="h-10 w-14 rounded border border-gray-200 dark:border-gray-700 cursor-pointer shrink-0" />
          <input type="text" value={brand} onChange={(e) => updateOrg("brand_color", e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
          <button type="button" onClick={() => updateOrg("brand_color", "var(--surface-navy)")}
            className="px-3 py-2 text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0">Reset</button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {BRAND_PRESETS.map((p) => (
            <button key={p.c} type="button" title={p.name} onClick={() => updateOrg("brand_color", p.c)}
              className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${brand.toLowerCase() === p.c.toLowerCase() ? "border-gray-900 dark:border-white" : "border-transparent"}`}
              style={{ background: p.c }} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorField label="Primary (buttons)" value={org.primary_color || brand} onChange={(v) => updateOrg("primary_color", v)} />
        <ColorField label="Secondary (accents)" value={org.secondary_color || "var(--surface-gold)"} onChange={(v) => updateOrg("secondary_color", v)} />
      </div>

      {/* Live preview — a real mini of the app chrome with this brand + auto-contrast text */}
      <div>
        <div className="text-xs text-gray-500 mb-2">Live preview — this is your school&apos;s app</div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex" style={{ height: 190 }}>
          {/* mini sidebar */}
          <div className="p-3 shrink-0" style={{ width: 132, background: grad, color: onText }}>
            <div className="flex items-center gap-2 mb-3">
              {org.logo_url
                ? <img src={absUrl(org.logo_url)} alt="" className="w-6 h-6 rounded object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                : <span className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-extrabold" style={{ background: "var(--surface-gold)", color: "var(--surface-navy)" }}>{(org.display_name || "S")[0]}</span>}
              <span className="text-[11px] font-extrabold leading-tight" style={{ color: onText }}>{(org.display_name || "Your School").slice(0, 12)}</span>
            </div>
            <div className="rounded-md px-2 py-1.5 text-[10px] font-bold mb-1" style={{ background: "var(--surface-gold)", color: "var(--surface-navy)" }}>Dashboard</div>
            {["Students", "Teachers", "Fees"].map((x) => (
              <div key={x} className="px-2 py-1.5 text-[10px]" style={{ color: dim(78) }}>{x}</div>
            ))}
          </div>
          {/* main */}
          <div className="flex-1 p-3 space-y-2.5" style={{ background: "#F6F4EE" }}>
            <div className="rounded-xl px-3 py-2.5" style={{ background: grad, color: onText }}>
              <div className="text-[12px] font-extrabold" style={{ color: onText }}>Good Morning, Priya! 👋</div>
              <div className="text-[9.5px]" style={{ color: onText, opacity: 0.78 }}>Here&apos;s what&apos;s happening today.</div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: brand, color: onText }}>Primary</span>
              <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold border" style={{ borderColor: brand, color: brand }}>Secondary</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contrast guarantee */}
      <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2.5">
        <span className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center text-[8px] font-bold" style={{ background: brand, color: onText }}>A</span>
        <span>
          Text automatically switches to <b>{onText === "#ffffff" ? "white" : "dark"}</b> for readability — no text is ever hidden, whatever colour you choose.
          {light && <span className="text-amber-600 dark:text-amber-400"> Tip: deeper, richer colours look best in the sidebar.</span>}
        </span>
      </div>
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-14 rounded border border-gray-200 dark:border-gray-700 cursor-pointer" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-[var(--surface-navy)]" : "bg-gray-300 dark:bg-gray-700"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </label>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{title}</div>
      {children}
    </div>
  );
}

export function SaveBtn({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-navy)] hover:opacity-90 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
    >
      {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
    </button>
  );
}
