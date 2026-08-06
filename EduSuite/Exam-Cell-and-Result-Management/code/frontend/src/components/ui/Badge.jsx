const styles = {
  green: 'bg-primary-50 text-primary-700',
  red: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
  slate: 'bg-slate-100 text-slate-600',
  emerald: 'bg-emerald-50 text-emerald-700',
};

export const Badge = ({ children, color = 'slate', className = '' }) => (
  <span className={`badge ${styles[color] || styles.slate} ${className}`}>{children}</span>
);
