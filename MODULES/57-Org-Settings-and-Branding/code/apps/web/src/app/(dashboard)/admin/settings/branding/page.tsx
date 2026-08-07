'use client';
import { useState, useEffect, useRef } from 'react';
import { toast as notify } from "@/components/ui/Toast";
import {
  Upload, Save, Palette, Building2, CheckCircle, AlertCircle,
  Eye, X, Sparkles, MapPin, Phone, Mail, Globe, Award, FileSignature, Image as ImageIcon
} from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { fileUrl, getToken } from '@/lib/apiClient';
import { ModulePage } from '@/components/module-kit/ModulePage';

import { API_URL as API } from "@/lib/apiUrl";

const PRESET_COLORS = [
  '#7F77DD', 'var(--brand)', 'var(--legacy-violet-500)', 'var(--chart-7)', '#ef4444',
  '#f59e0b', '#10b981', 'var(--chart-3)', 'var(--legacy-blue-500)', '#0ea5e9',
  '#14b8a6', '#1e293b'
];

const BOARDS = ['CBSE', 'ICSE', 'State', 'IB', 'Cambridge', 'Other'];

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold text-white animate-slide-up
      ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
      <button onClick={onClose} aria-label="Close" className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

function Section({ icon: Icon, title, desc, children }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#0F2147] flex items-center justify-center shrink-0">
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          {desc && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function Input(props: any) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
    />
  );
}

function Select({ children, ...props }: any) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-slate-900 dark:text-white"
    >{children}</select>
  );
}

function Textarea(props: any) {
  return (
    <textarea
      {...props}
      className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
    />
  );
}

function ImageUploader({ label, currentUrl, field, onUpload, hint }: any) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const token = getToken();
  const fullUrl = currentUrl ? `${fileUrl(currentUrl)}${currentUrl.startsWith('http') ? '' : `?t=${Date.now()}`}` : null;

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await fetch(`${API}/org/upload-logo`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      });
      const json = await res.json();
      if (json.success && json.data?.logo_url) {
        await onUpload(field, json.data.logo_url);
      } else {
        notify.error(json.message || 'Upload failed');
      }
    } catch (e: any) {
      notify.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
          {fullUrl ? (
            <img src={fullUrl} alt={label} className="w-full h-full object-contain" />
          ) : (
            <ImageIcon size={24} className="text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</div>
          {hint && <div className="text-[10px] text-slate-500 mb-2">{hint}</div>}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <div className="flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 disabled:opacity-50 flex items-center gap-1"
            >
              <Upload size={12} />
              {uploading ? 'Uploading…' : (fullUrl ? 'Replace' : 'Upload')}
            </button>
            {fullUrl && (
              <button
                onClick={() => onUpload(field, null)}
                className="px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-md transition-all ${value === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-110'}`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

export default function BrandingPage() {
  const { org, refreshOrg } = useOrg(); const branding: any = org || {}; const refresh = refreshOrg; const update = async (u: any) => { try { const t = getToken(); const r = await fetch(API + '/branding/me', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: JSON.stringify(u) }); const j = await r.json(); if (j.success) { await refreshOrg(); return true; } return false; } catch { return false; } };
  const [form, setForm] = useState(branding);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [previewMode, setPreviewMode] = useState<'pdf' | 'login' | 'badge'>('pdf');

  useEffect(() => { setForm(branding); }, [branding]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const ok = await update(form);
    setSaving(false);
    setToast({ msg: ok ? '✓ Branding saved successfully' : 'Save failed — try again', type: ok ? 'success' : 'error' });
  };

  const handleImageUpload = async (field: string, url: string | null) => {
    const ok = await update({ [field]: url });
    setToast({ msg: ok ? `✓ ${field.replace('_url', '').replace(/_/g, ' ')} updated` : 'Update failed', type: ok ? 'success' : 'error' });
  };

  const fullUrl = (u: string | null) => u ? fileUrl(u) : null;

  return (
    <ModulePage
      title="Make it yours"
      subtitle="Your branding will appear on PDFs, reports, login pages, WhatsApp messages, and certificates."
      icon={Palette}
      actions={
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 bg-[#0F2147] text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save all changes'}
        </button>
      }
    >
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT: Form sections */}
        <div className="lg:col-span-2 space-y-5">
          {/* Identity */}
          <Section icon={Building2} title="School identity" desc="Basic name and tagline shown across the platform">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full school name *">
                <Input value={form.name || ''} onChange={(e: any) => set('name', e.target.value)} placeholder="e.g. Delhi Public School" />
              </Field>
              <Field label="Short name" hint="Used in mobile, app icon">
                <Input value={form.short_name || ''} onChange={(e: any) => set('short_name', e.target.value)} placeholder="e.g. DPS" />
              </Field>
              <Field label="Tagline">
                <Input value={form.tagline || ''} onChange={(e: any) => set('tagline', e.target.value)} placeholder="Empowering young minds" />
              </Field>
              <Field label="Affiliation board">
                <Select value={form.affiliation_board || 'CBSE'} onChange={(e: any) => set('affiliation_board', e.target.value)}>
                  {BOARDS.map(b => <option key={b}>{b}</option>)}
                </Select>
              </Field>
              <Field label="Affiliation number">
                <Input value={form.affiliation_number || ''} onChange={(e: any) => set('affiliation_number', e.target.value)} placeholder="e.g. 1234567" />
              </Field>
              <Field label="Principal name">
                <Input value={form.principal_name || ''} onChange={(e: any) => set('principal_name', e.target.value)} placeholder="Dr. A. K. Sharma" />
              </Field>
            </div>
          </Section>

          {/* Logos */}
          <Section icon={ImageIcon} title="Logos & visuals" desc="Upload your school logo, favicon, seal, and principal signature">
            <div className="grid sm:grid-cols-2 gap-3">
              <ImageUploader label="Main logo" field="logo_url" currentUrl={form.logo_url} onUpload={handleImageUpload} hint="PNG/WebP, transparent background" />
              <ImageUploader label="Dark mode logo" field="logo_dark_url" currentUrl={form.logo_dark_url} onUpload={handleImageUpload} hint="Optional, for dark backgrounds" />
              <ImageUploader label="Favicon" field="favicon_url" currentUrl={form.favicon_url} onUpload={handleImageUpload} hint="32×32 px, ICO or PNG" />
              <ImageUploader label="School seal" field="school_seal_url" currentUrl={form.school_seal_url} onUpload={handleImageUpload} hint="For certificates & report cards" />
              <ImageUploader label="Principal signature" field="principal_signature_url" currentUrl={form.principal_signature_url} onUpload={handleImageUpload} hint="PNG with transparent bg" />
            </div>
          </Section>

          {/* Colors */}
          <Section icon={Palette} title="Brand colors" desc="Used across UI, PDFs, emails, and printed materials">
            <div className="grid sm:grid-cols-3 gap-4">
              <ColorPicker label="Primary" value={form.primary_color || '#7F77DD'} onChange={(v: string) => set('primary_color', v)} />
              <ColorPicker label="Secondary" value={form.secondary_color || '#534AB7'} onChange={(v: string) => set('secondary_color', v)} />
              <ColorPicker label="Accent" value={form.accent_color || 'var(--chart-3)'} onChange={(v: string) => set('accent_color', v)} />
            </div>
          </Section>

          {/* Address */}
          <Section icon={MapPin} title="Address" desc="Appears on receipts, report cards, and certificates">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Address line 1"><Input value={form.address_line1 || ''} onChange={(e: any) => set('address_line1', e.target.value)} placeholder="123 Main Road, Sector 5" /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Address line 2"><Input value={form.address_line2 || ''} onChange={(e: any) => set('address_line2', e.target.value)} placeholder="Near City Center" /></Field>
              </div>
              <Field label="City"><Input value={form.city || ''} onChange={(e: any) => set('city', e.target.value)} /></Field>
              <Field label="State"><Input value={form.state || ''} onChange={(e: any) => set('state', e.target.value)} /></Field>
              <Field label="Pincode"><Input value={form.pincode || ''} onChange={(e: any) => set('pincode', e.target.value)} /></Field>
              <Field label="Country"><Input value={form.country || 'India'} onChange={(e: any) => set('country', e.target.value)} /></Field>
            </div>
          </Section>

          {/* Contact */}
          <Section icon={Phone} title="Contact details" desc="Shown on official communications">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Phone"><Input type="tel" value={form.phone || ''} onChange={(e: any) => set('phone', e.target.value)} placeholder="+91 98765 43210" /></Field>
              <Field label="Email"><Input type="email" value={form.email || ''} onChange={(e: any) => set('email', e.target.value)} placeholder="info@school.edu" /></Field>
              <Field label="Website"><Input type="url" value={form.website || ''} onChange={(e: any) => set('website', e.target.value)} placeholder="https://school.edu" /></Field>
              <Field label="WhatsApp sender name" hint="Shown as prefix in WhatsApp messages"><Input value={form.whatsapp_sender_name || ''} onChange={(e: any) => set('whatsapp_sender_name', e.target.value)} placeholder="DPS Bangalore" /></Field>
            </div>
          </Section>

          {/* Footer */}
          <Section icon={FileSignature} title="Document footer" desc="Custom text at the bottom of report cards & certificates">
            <Field label="Report card footer text">
              <Textarea rows={3} value={form.report_card_footer || ''} onChange={(e: any) => set('report_card_footer', e.target.value)} placeholder="© 2026 Delhi Public School. All rights reserved. | Visit us at www.dps.edu" />
            </Field>
          </Section>
        </div>

        {/* RIGHT: Live Preview Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-indigo-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Live preview</span>
                </div>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                  <button onClick={() => setPreviewMode('pdf')} className={`px-2 py-1 text-[10px] font-semibold rounded ${previewMode === 'pdf' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500'}`}>PDF</button>
                  <button onClick={() => setPreviewMode('login')} className={`px-2 py-1 text-[10px] font-semibold rounded ${previewMode === 'login' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500'}`}>Login</button>
                  <button onClick={() => setPreviewMode('badge')} className={`px-2 py-1 text-[10px] font-semibold rounded ${previewMode === 'badge' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500'}`}>App</button>
                </div>
              </div>

              <div className="p-4">
                {previewMode === 'pdf' && (
                  <div className="bg-white border border-slate-300 rounded-md p-4 text-slate-900" style={{ minHeight: 380 }}>
                    <div className="flex items-center gap-3 pb-3 border-b-2" style={{ borderColor: form.primary_color }}>
                      {fullUrl(form.logo_url) ? (
                        <img src={fullUrl(form.logo_url)!} alt="logo" className="w-12 h-12 object-contain" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ background: form.primary_color }}>
                          {(form.short_name || form.name || 'S').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{form.name || 'School name'}</div>
                        {form.tagline && <div className="text-[10px] text-slate-500 italic truncate">{form.tagline}</div>}
                        {form.affiliation_number && <div className="text-[9px] text-slate-500">Affiliation: {form.affiliation_number} ({form.affiliation_board})</div>}
                      </div>
                    </div>
                    <div className="text-center my-4">
                      <div className="text-xs font-bold uppercase tracking-wider" style={{ color: form.primary_color }}>Recovery Worksheet</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">Mathematics · Class 10-A · Medium difficulty</div>
                    </div>
                    <div className="space-y-2 text-[10px]">
                      <div className="flex justify-between border-b border-slate-200 pb-1"><span>Student:</span> <span className="font-semibold">Aarav Sharma</span></div>
                      <div className="flex justify-between border-b border-slate-200 pb-1"><span>Date:</span> <span className="font-semibold">25 Apr 2026</span></div>
                      <div className="flex justify-between border-b border-slate-200 pb-1"><span>Total marks:</span> <span className="font-semibold">30</span></div>
                    </div>
                    <div className="mt-4 p-2 rounded text-[9px] text-center" style={{ background: form.accent_color + '15', color: form.accent_color }}>
                      Q1. If sin θ = 3/5, find cos θ.  [3 marks]
                    </div>
                    <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-end text-[9px] text-slate-500">
                      <div>
                        {form.principal_name && <div className="font-semibold">{form.principal_name}</div>}
                        <div>Principal</div>
                      </div>
                      {fullUrl(form.school_seal_url) && <img src={fullUrl(form.school_seal_url)!} alt="seal" className="w-10 h-10 opacity-70" />}
                    </div>
                    {form.report_card_footer && (
                      <div className="mt-3 pt-2 border-t border-slate-200 text-[8px] text-center text-slate-500 italic">
                        {form.report_card_footer}
                      </div>
                    )}
                  </div>
                )}

                {previewMode === 'login' && (
                  <div className="rounded-md overflow-hidden" style={{ background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})`, minHeight: 380 }}>
                    <div className="p-6 text-white text-center">
                      {fullUrl(form.logo_url) ? (
                        <img src={fullUrl(form.logo_url)!} alt="logo" className="w-20 h-20 object-contain mx-auto mb-4 bg-white/10 rounded-2xl p-2 backdrop-blur" />
                      ) : (
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-2xl">
                          {(form.short_name || form.name || 'S').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <h2 className="text-xl font-bold mb-1">{form.name || 'School name'}</h2>
                      {form.tagline && <p className="text-xs text-white/80 italic">{form.tagline}</p>}
                    </div>
                    <div className="bg-white/95 backdrop-blur p-5 rounded-t-3xl text-slate-900">
                      <div className="text-center mb-4">
                        <div className="text-sm font-bold">Welcome back</div>
                        <div className="text-[10px] text-slate-500">Sign in to continue</div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-slate-100 px-3 py-2 rounded-lg text-[10px] text-slate-400">Email address</div>
                        <div className="bg-slate-100 px-3 py-2 rounded-lg text-[10px] text-slate-400">Password</div>
                        <div className="text-white text-center text-[11px] font-semibold py-2 rounded-lg" style={{ background: form.primary_color }}>Sign in</div>
                      </div>
                    </div>
                  </div>
                )}

                {previewMode === 'badge' && (
                  <div className="space-y-3">
                    <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})` }}>
                      <div className="flex items-center gap-3">
                        {fullUrl(form.logo_url) ? (
                          <img src={fullUrl(form.logo_url)!} alt="logo" className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
                            {(form.short_name || form.name || 'S').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{form.short_name || form.name}</div>
                          <div className="text-[9px] opacity-80 truncate">{form.tagline || 'School portal'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-center">App icon, top bar, and notifications</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg" style={{ background: form.primary_color + '15', color: form.primary_color }}>
                        <div className="text-[9px] font-semibold">Primary</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: form.secondary_color + '15', color: form.secondary_color }}>
                        <div className="text-[9px] font-semibold">Secondary</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: form.accent_color + '15', color: form.accent_color }}>
                        <div className="text-[9px] font-semibold">Accent</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#F7F4EC] dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-2">
                <Award size={16} className="text-[#0F2147] dark:text-[#C8A04E] mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#0F2147] dark:text-white">Premium experience</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Branding applies automatically to PDFs, report cards, certificates, WhatsApp messages, and the parent app. Update once, reflects everywhere.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
