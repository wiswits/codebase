/* Small, dependency-free UI primitives used across PL screens. */

export function Panel({ title, action, children, style }) {
  return (
    <section
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 20,
        boxShadow: 'var(--shadow)',
        ...style,
      }}
    >
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {title && <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ value, label, tone = 'text' }) {
  return (
    <div
      style={{
        background: 'var(--panel-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '18px 16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 700, color: `var(--${tone})`, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

export function Bar({ pct, tone = 'brand', height = 10 }) {
  return (
    <div style={{ background: 'var(--panel-2)', borderRadius: 999, height, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: `var(--${tone})`, borderRadius: 999, transition: 'width .4s' }} />
    </div>
  );
}

export function toneForAccuracy(acc) {
  if (acc >= 70) return 'good';
  if (acc >= 50) return 'warn';
  return 'bad';
}
