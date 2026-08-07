'use client';
import { useState, useEffect } from 'react';
import { getToken } from '@/lib/apiClient';
import {
  Sparkles, Save, CheckCircle, AlertCircle, Loader2, Eye, EyeOff,
  Brain, Zap, ExternalLink, RefreshCw, TrendingUp, Activity,
  IndianRupee, Cpu, Shield, AlertTriangle, X
} from 'lucide-react';
import { ModulePage } from '@/components/module-kit/ModulePage';

import { API_URL as API } from "@/lib/apiUrl";

const PROVIDER_THEMES: any = {
  anthropic:        { icon: '🟠', tagline: 'Best quality reasoning' },
  openai:           { icon: '⚡', tagline: 'Most popular, balanced' },
  google:           { icon: '✨', tagline: 'Free tier available!' },
  groq:             { icon: '🚀', tagline: 'Lightning fast & cheap' },
  wiswits_default:  { icon: '⭐', tagline: 'Recommended · Plan-based limits' },
};

function Toast({ msg, type, onClose }: any) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold text-white animate-slide-up
      ${type === 'success' ? 'bg-emerald-500' : type === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : type === 'warning' ? <AlertTriangle size={16} /> : <AlertCircle size={16} />}
      <span className="max-w-md">{msg}</span>
      <button onClick={onClose} aria-label="Close"><X size={14} /></button>
    </div>
  );
}

export default function AISettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [providers, setProviders] = useState<any>({});
  const [pricing, setPricing] = useState<any>({});
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [provider, setProvider] = useState<string>('wiswits_default');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [budget, setBudget] = useState(500);
  const [fallback, setFallback] = useState(true);
  const [active, setActive] = useState(true);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<any>(null);

  const token = getToken(); // in-memory; fetches below also send the httpOnly cookie
  const headers: any = { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' };
  const withCreds: RequestInit = { credentials: 'include', headers };

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [cfgR, useR] = await Promise.allSettled([
        fetch(`${API}/ai-config`, withCreds).then(r => r.json()),
        fetch(`${API}/ai-config/usage`, withCreds).then(r => r.json()),
      ]);
      const cfgRes = cfgR.status === "fulfilled" ? cfgR.value : null;
      const useRes = useR.status === "fulfilled" ? useR.value : null;
      if (cfgRes?.success) {
        setProviders(cfgRes.providers);
        setPricing(cfgRes.pricing);
        if (cfgRes.config) {
          setConfig(cfgRes.config);
          setProvider(cfgRes.config.provider);
          setModel(cfgRes.config.model);
          setBudget(parseFloat(cfgRes.config.monthly_budget_inr) || 500);
          setFallback(!!cfgRes.config.fallback_to_wiswits);
          setActive(!!cfgRes.config.is_active);
        }
      }
      if (useRes?.success) setUsage(useRes);
      if (!cfgRes) setToast({ msg: 'Couldn’t load AI settings — please retry', type: 'error' });
    } catch {
      setToast({ msg: 'Couldn’t load AI settings — please retry', type: 'error' });
    } finally { setLoading(false); }
  }

  function pickProvider(p: string) {
    setProvider(p);
    setApiKey('');
    setTestResult(null);
    if (providers[p]) {
      setModel(providers[p].defaultModel);
    }
  }

  async function testKey() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API}/ai-config/test`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ provider, model, api_key: apiKey || '__keep__' }),
      });
      const j = await res.json();
      setTestResult({ ok: j.ok, message: j.message });
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message });
    } finally { setTesting(false); }
  }

  async function save() {
    if (provider !== 'wiswits_default' && !apiKey && !config?.api_key_last4) {
      setToast({ msg: 'Please add an API key first', type: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/ai-config`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          provider, model,
          api_key: apiKey || '__keep__',
          monthly_budget_inr: budget,
          fallback_to_wiswits: fallback,
          is_active: active,
        }),
      });
      const j = await res.json();
      if (j.success) {
        setToast({ msg: '✓ AI configuration saved successfully', type: 'success' });
        setApiKey('');
        await loadAll();
      } else {
        setToast({ msg: j.message || 'Save failed', type: 'error' });
      }
    } catch (e: any) {
      setToast({ msg: e.message, type: 'error' });
    } finally { setSaving(false); }
  }

  const models = pricing[provider] ? Object.keys(pricing[provider]) : [];
  const currentPricing = pricing[provider]?.[model];
  const spendPct = budget > 0 && config ? Math.min(100, (parseFloat(config.current_month_spend_inr) / budget) * 100) : 0;

  return (
    <ModulePage
      title="Bring your own AI"
      subtitle="Choose your AI provider, set monthly budget. Pay only what you use, directly to provider."
      icon={Sparkles}
      loading={loading}
      actions={
        <button onClick={save} disabled={saving} className="px-5 py-2.5 bg-[#0F2147] text-white text-sm font-semibold rounded-xl shadow hover:opacity-90 disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save configuration'}
        </button>
      }
    >
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* LEFT: Configuration */}
        <div className="lg:col-span-2 space-y-5">
          {/* Provider Selection */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={18} className="text-[#0F2147] dark:text-white" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Select AI provider</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(providers).map(([key, info]: any) => {
                const theme = PROVIDER_THEMES[key];
                const isSelected = provider === key;
                return (
                  <button
                    key={key}
                    onClick={() => pickProvider(key)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-[#0F2147] bg-[#F7F4EC] dark:bg-slate-800 shadow' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                  >
                    <div className="text-2xl mb-2">{theme.icon}</div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{info.name}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{theme.tagline}</div>
                    {info.signupUrl && (
                      <a href={info.signupUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] mt-2 text-[#0F2147] dark:text-white hover:underline" onClick={e => e.stopPropagation()}>
                        Get key <ExternalLink size={10} />
                      </a>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* WISWITS AI - Plan-based info card */}
          {provider === 'wiswits_default' && (
            <div className="bg-[#F7F4EC] dark:bg-slate-900 rounded-2xl border-2 border-[#0F2147] dark:border-slate-700 p-5 sm:p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0F2147] flex items-center justify-center shrink-0 shadow">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">WISWITS AI Active</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">No setup needed. Powered by your subscription plan.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">Active</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-semibold text-[#0F2147] dark:text-white uppercase tracking-wider mb-1">Your Plan</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">Pro Plan</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">200K tokens/month included</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-semibold text-[#0F2147] dark:text-white uppercase tracking-wider mb-1">Used this month</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{usage?.month?.tokens ? parseInt(usage.month.tokens).toLocaleString() : '0'}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">tokens consumed</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white/60 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-2">
                  <Shield size={14} className="text-[#0F2147] dark:text-white mt-0.5 shrink-0" />
                  <div className="text-[11px] text-slate-700 dark:text-slate-300">
                    <strong>Premium AI quality</strong> for worksheets, profiles, doubt-solving and more. Upgrade your plan anytime for higher limits.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Model + Key (only for non-WISWITS providers) */}
          {provider !== 'wiswits_default' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={18} className="text-[#0F2147] dark:text-white" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Model & API key</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2147]/40 text-slate-900 dark:text-white">
                {models.map((m: string) => {
                  const p = pricing[provider]?.[m];
                  const cost = p ? `₹${p.input}/M in · ₹${p.output}/M out` : '';
                  return <option key={m} value={m}>{m} — {cost}</option>;
                })}
              </select>
              {currentPricing && (
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  Estimated cost per worksheet (~3K tokens): <strong className="text-[#0F2147] dark:text-white">₹{((currentPricing.input * 0.5 + currentPricing.output * 2.5) / 1000).toFixed(3)}</strong>
                </div>
              )}
            </div>

            {provider !== 'wiswits_default' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">API key</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={config?.api_key_last4 ? `Current: ${config.api_key_last4} (paste new to replace)` : 'Paste your API key here'}
                      className="w-full px-3 py-2.5 pr-10 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#0F2147]/40 text-slate-900 dark:text-white"
                    />
                    <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button onClick={testKey} disabled={testing || (!apiKey && !config?.api_key_last4)} className="px-4 py-2.5 bg-[#0F2147] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5">
                    {testing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    Test
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Shield size={11} /> Encrypted with AES-256 at rest. Only you can access it.
                </div>
                {testResult && (
                  <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 text-xs ${testResult.ok ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300'}`}>
                    {testResult.ok ? <CheckCircle size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
                    <div><strong>{testResult.ok ? 'Connection successful!' : 'Connection failed'}</strong><div className="opacity-80 mt-0.5">{testResult.message}</div></div>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Budget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <IndianRupee size={18} className="text-[#0F2147] dark:text-white" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Monthly budget</h3>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">₹{budget}</span>
              <span className="text-sm text-slate-500">/ month</span>
              {budget === 0 && <span className="ml-auto text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">Unlimited</span>}
            </div>
            <input type="range" min="0" max="10000" step="50" value={budget} onChange={(e) => setBudget(parseInt(e.target.value))} className="w-full accent-[#0F2147]" />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>₹0 (unlimited)</span><span>₹2,500</span><span>₹5,000</span><span>₹10,000+</span>
            </div>
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
              ~ {budget === 0 ? 'unlimited' : Math.floor(budget / 0.5)} worksheets per month with current model
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={fallback} onChange={(e) => setFallback(e.target.checked)} className="mt-0.5 accent-[#0F2147]" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Fallback to WISWITS default if budget exhausted</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Keeps AI features working even after limit. Uses our quota.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="mt-0.5 accent-[#0F2147]" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Enable AI features</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Master switch — disables all AI calls if turned off.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT: Usage Dashboard */}
        <div className="lg:col-span-1 space-y-4">
          <div className="on-dark rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg,#7C5CFC 0%,#6366F1 100%)", boxShadow: "0 16px 36px -16px rgba(124,92,252,.55)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Live usage</span>
              </div>
              <button onClick={loadAll} aria-label="Refresh" className="text-white/70 hover:text-white"><RefreshCw size={14} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/70">Today</div>
                <div className="text-2xl font-bold">₹{parseFloat(usage?.today?.cost || 0).toFixed(2)}</div>
                <div className="text-[10px] text-white/70">{usage?.today?.calls || 0} calls · {parseInt(usage?.today?.tokens || 0).toLocaleString()} tokens</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/70">This month</div>
                <div className="text-2xl font-bold">₹{parseFloat(usage?.month?.cost || 0).toFixed(2)}</div>
                <div className="text-[10px] text-white/70">{usage?.month?.calls || 0} calls · {parseInt(usage?.month?.tokens || 0).toLocaleString()} tokens</div>
                {budget > 0 && (
                  <div className="mt-2">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all" style={{ width: `${spendPct}%` }} />
                    </div>
                    <div className="text-[10px] text-white/70 mt-1">{spendPct.toFixed(0)}% of ₹{budget} budget</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {usage?.byFeature?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-[#0F2147] dark:text-white" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">By feature (30d)</span>
              </div>
              <div className="space-y-2.5">
                {usage.byFeature.map((f: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{f.feature.replace(/_/g, ' ')}</span>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white">₹{parseFloat(f.cost).toFixed(2)}</div>
                      <div className="text-[9px] text-slate-500">{f.calls} calls</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {usage?.recent?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Recent calls</div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {usage.recent.map((r: any) => (
                  <div key={r.id} className="text-[11px] flex justify-between gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-700 dark:text-slate-300 capitalize truncate">{r.feature.replace(/_/g, ' ')}</div>
                      <div className="text-[9px] text-slate-500">{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-bold ${r.status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>₹{parseFloat(r.cost_inr).toFixed(3)}</div>
                      <div className="text-[9px] text-slate-500">{r.total_tokens}t</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
