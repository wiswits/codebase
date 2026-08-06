'use client';
/**
 * BILLING — what this institution pays WisWits, and how to change it.
 *
 * There was no such page. A school could not see its plan, its price, what it had been
 * charged, or how to upgrade — the whole money relationship was invisible from inside
 * the product. This is that page.
 *
 * Two things it deliberately does NOT do:
 *   • it never shows our COST (₹ per AI request). That is our number, not theirs.
 *   • it never uses the word "mandate", "webhook", "gateway" or "e-mandate". §1 says
 *     never expose technical implementation, and a school administrator reads
 *     "autopay", not "e-mandate".
 */
import { useState, useEffect, useCallback } from 'react';
import { getToken } from '@/lib/apiClient';
import {
  CreditCard, CheckCircle, AlertCircle, AlertTriangle, Users,
  Sparkles, HardDrive, Download, ArrowUpRight, Info, X, ShieldCheck, Calendar, Check,
  Sprout, WifiOff, Building2,
} from 'lucide-react';
import { ModulePage } from '@/components/module-kit/ModulePage';
import { AppButton } from '@/components/ui/app-button';
import { API_URL as API } from '@/lib/apiUrl';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckout } from '@/components/billing/useCheckout';
import { CheckoutDialog } from '@/components/billing/CheckoutDialog';

/* There was a toast here. It said "your plan is ready" and was, for months, the only
   thing that happened when a school chose a plan — no payment window, no charge, a
   subscription left `pending` forever. Choosing a plan is now a conversation with an
   outcome, and every one of those outcomes has its own words in CheckoutDialog. A
   four-second toast is the wrong surface for anything to do with money. */

const gb = (bytes: number) => `${(Number(bytes || 0) / 1024 ** 3).toFixed(1)} GB`;

/** A usage meter. `limit === null` means unlimited, which must never render as 0%. */
function Meter({ icon, label, used, limit, format }: any) {
  const unlimited = limit === null || limit === undefined;
  const pct = unlimited ? 0 : Math.min(100, Math.round((Number(used) / Math.max(1, Number(limit))) * 100));
  const over = !unlimited && Number(used) > Number(limit);
  const fmt = format || ((v: any) => String(v));
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
        {icon}<span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-[var(--surface-navy)]">
        {fmt(used)}
        <span className="text-sm font-medium text-slate-400">
          {unlimited ? ' / unlimited' : ` / ${fmt(limit)}`}
        </span>
      </div>
      {!unlimited && (
        <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 85 ? 'bg-amber-500' : 'bg-[var(--surface-gold)]'}`}
            style={{ width: `${Math.max(2, pct)}%` }}
          />
        </div>
      )}
      {over && <p className="mt-2 text-xs font-semibold text-red-600">Over your plan&apos;s limit</p>}
    </div>
  );
}

/* ══ WHAT YOUR SCHOOL GOT ══════════════════════════════════════════════════
   At renewal a principal asks one question: "what did we actually get for
   this?" If the only place that answer exists is a sales deck, half the renewal
   is already lost. So it lives at the top of the page they open all year, and
   the price below it becomes a receipt for something visibly worth it.

   EVERY NUMBER IS COUNTED, NOT ESTIMATED. The API returns each figure with the
   raw counts behind it and a plain-English `basis` sentence naming exactly what
   was counted; both are rendered — the supporting line under each number, the
   full sentences behind "How these are counted". Nothing here is rounded up in
   our favour, and a metric the data cannot support is simply absent.

   ZEROS ARE NOT A CELEBRATION. A school in its first week has an honest report
   full of zeros, and 48px of "0" is the opposite of the point. `has_history`
   comes from the API — when nothing has happened yet the strip says so warmly
   and gets out of the way.

   IT IS ALSO OPTIONAL. It loads separately from /billing and can fail on its
   own without taking the plan, the meters or the invoices down with it — the
   same trade the pack section already makes. A school worried about a failed
   payment must still see everything that matters. */
function ValueStrip() {
  type Status = 'loading' | 'ready' | 'error' | 'offline';
  const [status, setStatus] = useState<Status>('loading');
  const [report, setReport] = useState<any>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    // Checked before the request, not after: a failed fetch with no network is
    // "you are offline", which the person can act on, not "something went
    // wrong", which they cannot.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus('offline');
      return;
    }
    try {
      const token = getToken();
      const r = await fetch(`${API}/value-report`, {
        credentials: 'include',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
      });
      const j = await r.json();
      // { status: 'success', data } — NOT { success: true }. Same envelope trap
      // as the main billing fetch above.
      if (!r.ok || j?.status !== 'success') throw new Error(j?.message || 'Could not load your figures');
      setReport(j.data);
      setStatus('ready');
    } catch (e: any) {
      setMessage(e?.message || 'Could not load your figures');
      setStatus(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const shell = (children: any) => (
    <section
      aria-label="What your school got this session"
      className="rounded-xl border border-[var(--surface-gold)]/30 bg-[var(--surface-ivory)] p-6 sm:p-8"
    >
      {children}
    </section>
  );

  if (status === 'loading') {
    return shell(
      <div aria-busy="true" className="space-y-6">
        <div className="h-3 w-48 rounded bg-[var(--surface-card)]/70 animate-pulse" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-8 w-24 rounded bg-[var(--surface-card)]/70 animate-pulse" />
              <div className="h-3 w-20 rounded bg-[var(--surface-card)]/70 animate-pulse" />
            </div>
          ))}
        </div>
      </div>,
    );
  }

  if (status === 'offline') {
    return shell(
      <div className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
        <WifiOff size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
        <div>
          <p className="font-semibold text-[var(--surface-navy)]">Your figures need a connection</p>
          <p className="mt-1">They will be here as soon as you are back online.</p>
        </div>
      </div>,
    );
  }

  if (status === 'error') {
    return shell(
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--surface-warning)]" />
          <div>
            <p className="font-semibold text-[var(--surface-navy)]">{message}</p>
            <p className="mt-1 text-[var(--text-secondary)]">
              Everything else on this page is unaffected.
            </p>
          </div>
        </div>
        <AppButton variant="secondary" size="sm" onClick={load}>Try again</AppButton>
      </div>,
    );
  }

  const session = report?.session;
  // Only figures that actually happened. A metric sitting at zero is honest but
  // it is not the school's year, and five of them in a row is a scoreboard of
  // things they have not switched on yet. Capped at five so the strip stays
  // readable on a phone.
  const shown = (report?.metrics || []).filter((m: any) => Number(m.value) > 0).slice(0, 5);

  if (!report?.has_history || shown.length === 0) {
    return shell(
      <div className="flex items-start gap-3">
        <Sprout size={18} className="mt-1 shrink-0 text-[var(--surface-gold)]" />
        <div>
          <h2 className="font-[Playfair_Display] text-2xl text-[var(--surface-navy)]">
            Your first session with us is just starting
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
            As your school records fees, attendance, messages and results in WisWits, this is
            where the year adds up — your own numbers, counted from your own records. There is
            nothing to show yet, which is exactly right this early.
          </p>
        </div>
      </div>,
    );
  }

  return shell(
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--on-ivory-muted)]">
          Your {session?.label} session so far
        </h2>
        {report.branch_scoped && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--on-ivory-muted)]">
            <Building2 size={12} /> This branch only
          </span>
        )}
      </div>

      {/* Columns follow the number of figures so four never leave a hole where a
          fifth would be. Written as whole class strings — Tailwind reads source
          text, so a composed `lg:grid-cols-${n}` would produce no CSS at all. */}
      <div className={`mt-6 grid grid-cols-2 gap-x-8 gap-y-8 ${
        shown.length >= 5 ? 'sm:grid-cols-3 lg:grid-cols-5'
          : shown.length === 4 ? 'lg:grid-cols-4'
          : shown.length === 3 ? 'sm:grid-cols-3'
          : 'sm:grid-cols-2'
      }`}>
        {shown.map((m: any) => (
          <div key={m.key}>
            <div className="font-[Playfair_Display] text-3xl leading-none text-[var(--surface-navy)] sm:text-4xl">
              {m.display}
            </div>
            <p className="mt-2.5 text-sm font-medium text-[var(--on-ivory)]">{m.label}</p>
            {m.detail && (
              <p className="mt-1 text-xs leading-relaxed text-[var(--on-ivory-muted)]">{m.detail}</p>
            )}
          </div>
        ))}
      </div>

      {/* The basis, stated rather than implied. A number a principal cannot
          trace is a number a principal can dismiss, so the exact derivation of
          every figure above is one click away and written in plain English. */}
      <details className="group mt-7 border-t border-[var(--surface-gold)]/25 pt-4">
        <summary className="cursor-pointer list-none text-xs font-semibold text-[var(--on-ivory-muted)] hover:text-[var(--surface-navy)]">
          <span className="inline-flex items-center gap-1.5">
            <Info size={12} /> How these are counted
          </span>
        </summary>
        <dl className="mt-3 space-y-2.5">
          {shown.map((m: any) => (
            <div key={m.key} className="text-xs leading-relaxed">
              <dt className="inline font-semibold text-[var(--on-ivory)]">{m.label}: </dt>
              <dd className="inline text-[var(--on-ivory-muted)]">{m.basis}</dd>
            </div>
          ))}
          <p className="pt-1 text-xs leading-relaxed text-[var(--on-ivory-muted)]">
            Counted from your own records, from {session?.basis}, up to{' '}
            {session?.upto
              ? new Date(`${session.upto}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'today'}
            .
            {report.branch_scoped &&
              ' Figures that WisWits records for the whole organisation rather than per branch are not shown in a branch view.'}
          </p>
        </dl>
      </details>
    </>,
  );
}

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  // The pack comes from /pricing/my-pack rather than being folded into /billing:
  // one implementation of "what does this org's pack include and what would an
  // add-on cost them", with two callers. Duplicating it into billingSummary would
  // be a second answer to the same question, which is the whole class of bug this
  // pricing work exists to remove.
  const [pack, setPack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const { user } = useAuth();

  const token = getToken();
  const headers: any = { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' };

  // `quiet` exists for the re-read after a payment: the checkout panel is on screen and
  // showing the page skeleton would tear it off mid-sentence. It returns the data as
  // well as storing it, so the panel can say what they will now be charged without a
  // second implementation of this fetch.
  const load = useCallback(async (quiet = false): Promise<any> => {
    if (!quiet) setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch(`${API}/billing`, { credentials: 'include', headers });
      const j = await r.json();
      // The API envelope is { status: 'success', message, data } — utils/response.js.
      // NOT { success: true }: checking `j.success` (which some existing pages do) is
      // always falsy here, so the page would show "Could not load billing" on a
      // perfectly good 200. Caught by the pre-launch smoke script.
      if (!r.ok || j?.status !== 'success') throw new Error(j?.message || 'Could not load billing');
      setData(j.data);
      // Only on the first read. Re-reading after a payment must not yank the toggle
      // out from under somebody who has just moved it.
      if (!quiet && j.data?.subscription?.cycle === 'annual') setCycle('annual');

      // Fetched separately and allowed to fail SILENTLY: the pack is extra context,
      // and a school must still be able to see its plan, its usage and its invoices
      // if this one call breaks. Blocking the whole billing page on a nice-to-have
      // section would be the wrong trade on the page people open when they are
      // worried about money.
      try {
        const pr = await fetch(`${API}/pricing/my-pack`, { credentials: 'include', headers });
        const pj = await pr.json();
        if (pr.ok && pj?.status === 'success') setPack(pj.data);
      } catch { /* the page is fine without it */ }
      return j.data;
    } catch (e: any) {
      setLoadError(e.message || 'Could not load billing');
      return null;
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load(); }, [load]);

  // ── CHOOSING A PLAN NOW ENDS IN A PAYMENT ─────────────────────────────────
  // This used to POST /billing/start, show a green toast and stop — the school was
  // told its plan was "ready" while no payment window ever opened and the
  // subscription sat `pending` forever. The whole handoff (start → payment window →
  // confirm) and every outcome of it now lives in useCheckout + CheckoutDialog, which
  // follow the contract in docs/process/GO_LIVE_PAYMENTS.md Part 3.
  const checkout = useCheckout({
    cycle,
    refresh: () => load(true),
    payer: {
      name: [user?.first_name, user?.last_name].filter(Boolean).join(' '),
      email: user?.email,
      phone: (user as any)?.phone,
    },
  });

  const sub = data?.subscription;
  const notice = data?.notice;
  // `live` comes from the payment credentials, not from a build flag — it was already
  // in the API response and simply never read. Default to FALSE while loading so the
  // page can never briefly offer a checkout that the server would refuse.
  const paymentsLive = data?.live === true;

  return (
    <ModulePage
      title="Billing"
      subtitle="Your plan, what it costs, and your invoices"
      breadcrumb={[{ label: 'Settings', href: '/settings' }, { label: 'Billing' }]}
    >
      {/* Every outcome of choosing a plan, in its own words. */}
      <CheckoutDialog checkout={checkout} />

      {/* loading */}
      {loading && (
        <div className="space-y-4" aria-busy="true">
          <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        </div>
      )}

      {/* error + retry */}
      {!loading && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-red-500" size={24} />
          <p className="font-semibold text-red-800">{loadError}</p>
          <div className="mt-3 flex justify-center">
            <AppButton variant="danger" size="sm" onClick={() => { void load(); }}>Try again</AppButton>
          </div>
        </div>
      )}

      {!loading && !loadError && data && (
        <div className="space-y-6">
          {/* dunning notice — reassurance first, because the fear is what stops a
              school from calling its bank */}
          {notice && (
            <div className={`rounded-xl border p-4 ${notice.severity === 'error' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={notice.severity === 'error' ? 'text-red-500' : 'text-amber-500'} size={20} />
                <div>
                  <p className={`font-semibold ${notice.severity === 'error' ? 'text-red-800' : 'text-amber-900'}`}>{notice.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{notice.reassurance}</p>
                </div>
              </div>
            </div>
          )}

          {/* what the school GOT — above the price, BELOW the dunning notice.
              The order is deliberate: a school worried about a failed payment
              must see that first. Celebrating a year at someone who is trying to
              work out why their card was declined is the wrong page. */}
          <ValueStrip />

          {/* current plan */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <CreditCard size={14} /> Current plan
                </div>
                {sub ? (
                  <>
                    {/* The owner's label wins over the tier name where one is set. A
                        school on Complete at a negotiated session price is a "Pilot" —
                        calling it Complete is true about the tier and hides what the
                        arrangement actually is. */}
                    <h2 className="mt-1 font-[Playfair_Display] text-3xl text-[var(--surface-navy)]">
                      {sub.plan_label || sub.plan?.name}
                    </h2>
                    {sub.plan_label && sub.plan?.name && (
                      <p className="mt-0.5 text-xs text-slate-500">on the {sub.plan.name} plan</p>
                    )}
                    <p className="mt-1 text-sm text-slate-600">
                      {sub.current_price?.display}
                      {/* `per` comes from the API, which knows the cycle the number was
                          priced for. Deriving it here from sub.cycle was how an ANNUAL
                          figure came to be labelled "per month" — ₹19,990 per month for a
                          school whose agreed price is ₹51,000 for the session. */}
                      <span className="text-slate-400"> per {sub.current_price?.per || (sub.cycle === 'annual' ? 'year' : 'month')}</span>
                      {/* AK's rule 6: show the higher number and the discount. Only
                          rendered when there genuinely is one. */}
                      {sub.list_price && (
                        <span className="ml-2 text-slate-400">
                          <s>{sub.list_price.display}</s> list
                        </span>
                      )}
                    </p>
                    {/* The basis is shown because a school that expected 40 × ₹9 and
                        sees ₹999 will otherwise believe it was overcharged. */}
                    {sub.current_price?.basis && (
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
                        <Info size={12} className="mt-0.5 shrink-0" />{sub.current_price.basis}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="mt-1 font-[Playfair_Display] text-3xl text-[var(--surface-navy)]">No plan yet</h2>
                    <p className="mt-1 text-sm text-slate-600">Choose a plan below to get started.</p>
                  </>
                )}
              </div>
              {sub && (
                <div className="text-right text-sm">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold
                    ${sub.status === 'active' ? 'bg-emerald-50 text-emerald-700'
                      : sub.status === 'trial' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {sub.status === 'active' ? <ShieldCheck size={12} /> : <Calendar size={12} />}
                    {sub.status === 'trial' ? 'Trial' : sub.status === 'active' ? 'Active' : sub.status}
                  </span>
                  {sub.next_charge_at && (
                    <p className="mt-2 text-slate-500">
                      Next payment {new Date(sub.next_charge_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {data.students} student{data.students === 1 ? '' : 's'} · every login free
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* NO <LimitNudges /> HERE, AND THAT IS DELIBERATE. It is mounted once in
              DashLayout, which wraps this page too — so the nudge already appears
              above, exactly as it does on every other page in the shell. Mounting it
              again here rendered it TWICE (measured in a browser: two identical cards
              on this page, one everywhere else). Its once-a-day guard is marked in an
              effect, so two instances in the same commit both pass the check before
              either has marked it. One mount, one nudge. */}

          {/* usage meters */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Meter icon={<Users size={13} />} label="Students" used={data.usage?.students?.used ?? 0} limit={data.usage?.students?.limit ?? null} />
            <Meter icon={<Sparkles size={13} />} label="AI credits this month" used={data.usage?.ai?.used ?? 0} limit={data.usage?.ai?.limit ?? null} />
            <Meter icon={<HardDrive size={13} />} label="Storage" used={data.usage?.storage?.usedBytes ?? 0}
              limit={data.usage?.storage?.limitGb == null ? null : data.usage.storage.limitGb * 1024 ** 3} format={gb} />
          </div>

          {/* ── WHAT YOUR PLAN INCLUDES ─────────────────────────────────────
              READ-ONLY, deliberately. A school may see its price and everything
              its pack covers; it may never move the price. That asymmetry is the
              design (PRICING_FLEXIBILITY_DESIGN §2) — WisWits sets the school's
              subscription price, the school sets its parents' fees.

              Every number here is priced for THIS org at THIS headcount by the
              same resolution chain that produces the invoice, so an add-on price
              shown is the price they would actually be charged rather than a
              generic list rate they would then dispute. */}
          {pack && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  What your plan includes
                </h3>
                <span className="text-xs text-slate-400">
                  {pack.included?.length || 0} included
                  {pack.paidAddons?.length ? ` · ${pack.paidAddons.length} add-on${pack.paidAddons.length === 1 ? '' : 's'}` : ''}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {pack.included?.map((m: any) => (
                  <span key={m.module_key}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-ivory)] px-2.5 py-1.5 text-xs font-medium text-[var(--surface-navy)]">
                    <Check size={11} /> {m.name}
                  </span>
                ))}
              </div>

              {pack.paidAddons?.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your add-ons</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pack.paidAddons.map((a: any) => (
                      <span key={a.module_key}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--surface-gold)]/40 bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--surface-navy)]">
                        {a.name} <span className="text-slate-500">{a.price}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pack.available?.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Available to add
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Priced for your {pack.students} student{pack.students === 1 ? '' : 's'}. Moving up a
                    plan is often cheaper than adding several — talk to us and we will work it out with you.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {pack.available.map((a: any) => (
                      <div key={a.module_key}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                        <span className="truncate text-xs font-medium text-slate-700">{a.name}</span>
                        <span className="shrink-0 text-xs font-semibold text-slate-900">{a.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── THE LADDER — NOT SHOWN TO A NEGOTIATED CUSTOMER ────────────────
              A school whose price was agreed with us is not choosing from a menu.
              Showing a pilot paying ₹51,000 for the session a grid of ₹999/₹1,499/
              ₹1,999 cards invites the wrong question. `ladder_hidden` comes from the
              API — the decision belongs with the data, not with a check in the
              browser that a future redesign could drop. */}
          {data.ladder_hidden ? (
            <div className="rounded-xl border border-[var(--surface-gold)]/30 bg-[var(--surface-gold-soft)] p-5 text-sm text-slate-700">
              <p className="font-semibold text-[var(--surface-navy)]">Your plan is set up for you</p>
              <p className="mt-1 leading-relaxed">
                WisWits has agreed this arrangement with your school directly, so there is
                nothing for you to choose here. If anything about it should change, talk to
                us and we will sort it out.
              </p>
            </div>
          ) : (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-[Playfair_Display] text-xl text-[var(--surface-navy)]">Plans</h3>
              {/* Annual is the default pitch: it is 2 months free for them and cash on
                  day one for us. */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
                {(['monthly', 'annual'] as const).map((c) => (
                  <AppButton
                    key={c}
                    size="sm"
                    variant={cycle === c ? 'primary' : 'ghost'}
                    aria-pressed={cycle === c}
                    onClick={() => setCycle(c)}
                  >
                    {c === 'monthly' ? 'Monthly' : 'Yearly · 2 months free'}
                  </AppButton>
                ))}
              </div>
            </div>

            {data.ladder?.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                No plans are set up for your institution type yet. Please contact WisWits.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {data.ladder?.map((p: any) => {
                const price = cycle === 'annual' ? p.annual : p.monthly;
                return (
                  <div key={p.slug}
                    className={`relative flex flex-col rounded-xl border bg-white p-5 transition
                      ${p.current ? 'border-[var(--surface-gold)] ring-2 ring-[var(--surface-gold)]/30' : 'border-slate-200 hover:border-slate-300'}`}>
                    {p.current && (
                      <span className="absolute -top-2.5 left-5 rounded-full bg-[var(--surface-gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Your plan
                      </span>
                    )}
                    <h4 className="font-[Playfair_Display] text-xl text-[var(--surface-navy)]">{p.name}</h4>
                    <p className="mt-0.5 text-xs text-slate-500">{p.tagline}</p>

                    <div className="mt-3">
                      <div className="text-2xl font-bold text-[var(--surface-navy)]">{p.custom ? 'Custom' : price.display}</div>
                      {!p.custom && (
                        <p className="text-xs text-slate-500">
                          per {cycle === 'annual' ? 'year' : 'month'}
                          {p.billingMode === 'per_student' && ` · ₹${p.ratePerStudent}/student`}
                        </p>
                      )}
                      {!p.custom && cycle === 'annual' && price.savingPaise > 0 && (
                        <p className="mt-1 text-xs font-semibold text-emerald-600">You save {price.savingDisplay}</p>
                      )}
                    </div>

                    <ul className="mt-4 flex-1 space-y-1.5 text-xs text-slate-600">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                        {p.maxStudents === null ? 'Unlimited students' : `Up to ${p.maxStudents.toLocaleString('en-IN')} students`}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                        Unlimited teacher, student and parent logins
                      </li>
                      <li className="flex items-center gap-1.5">
                        {p.aiCredits ? <CheckCircle size={12} className="text-emerald-500 shrink-0" /> : <X size={12} className="text-slate-300 shrink-0" />}
                        {p.aiCredits === null ? 'AI credits included'
                          : p.aiCredits ? `${p.aiCredits.toLocaleString('en-IN')} AI credits a month` : 'No AI credits'}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                        {p.storageGb === null ? 'Storage included' : `${p.storageGb} GB storage`}
                      </li>
                      <li className="flex items-center gap-1.5">
                        {p.whitelabel ? <CheckCircle size={12} className="text-emerald-500 shrink-0" /> : <X size={12} className="text-slate-300 shrink-0" />}
                        Your own branding
                      </li>
                    </ul>

                    {/* Until online payment is switched on, choosing a plan is a
                        conversation, not a checkout. The API refuses to start a
                        mandate while the gateway is not live (it would otherwise
                        write a real subscription row against a mock gateway), so
                        the button must not invite a click that can only fail.

                        DISABLED WHILE ANYTHING IS IN FLIGHT, on every card, not just
                        the one clicked: a second click anywhere while the first is
                        working is a second autopay set-up, and the school finds out
                        at its bank. useCheckout holds the same line a second time,
                        because a disabled attribute is a courtesy and not a lock. */}
                    <AppButton
                      className="mt-4 w-full"
                      variant={p.current ? 'secondary' : 'primary'}
                      disabled={p.current || checkout.busy || !paymentsLive}
                      loading={checkout.busy && checkout.plan?.id === p.id}
                      onClick={() => { void checkout.begin({ id: p.id, name: p.name }); }}
                      title={!paymentsLive && !p.current ? 'Online payment is being set up — talk to us to change your plan' : undefined}
                    >
                      {p.current ? 'Current plan'
                        : p.custom ? 'Talk to us'
                        : !paymentsLive ? 'Talk to us'
                        : <>Choose {p.name} <ArrowUpRight size={14} /></>}
                    </AppButton>
                  </div>
                );
              })}
            </div>
            {/* No amount is written here. The first payment is a small one to confirm
                autopay, and its exact figure comes from the API when a plan is chosen —
                a number typed into this sentence is a second version of the price, and
                this page has already paid for that mistake once. */}
            <p className="mt-3 text-xs text-slate-500">
              {paymentsLive
                ? <>Choosing a plan shows you exactly what you pay and when, before anything is charged.
                    Your price never goes up while you stay with us.</>
                : <>Online payment is being set up. Tell us which plan suits you and we will move you onto it —
                    nothing is charged in the meantime, and your price never goes up while you stay with us.</>}
            </p>
          </div>
          )}

          {/* invoices */}
          <div>
            <h3 className="mb-3 font-[Playfair_Display] text-xl text-[var(--surface-navy)]">Invoices</h3>
            {data.invoices?.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                No invoices yet. Your first one appears after your first payment.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Invoice</th>
                      <th className="px-4 py-3 font-semibold">Period</th>
                      <th className="px-4 py-3 font-semibold">Students</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map((inv: any, i: number) => (
                      <tr key={inv.invoice_number} className={i % 2 ? 'bg-slate-50/50' : ''}>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{inv.invoice_number}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {inv.period_start ? new Date(inv.period_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                          {inv.period_end ? ` – ${new Date(inv.period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}` : ''}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{inv.student_count ?? '—'}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--surface-navy)]">{inv.total_display}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold
                            ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700'
                              : inv.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a href={`/api/billing/invoices/${encodeURIComponent(inv.invoice_number)}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--surface-navy)] hover:underline">
                            <Download size={12} /> View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </ModulePage>
  );
}
