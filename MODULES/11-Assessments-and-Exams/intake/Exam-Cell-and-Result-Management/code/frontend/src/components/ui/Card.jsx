export const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

export const StatCard = ({ icon: Icon, label, value, iconBg = 'bg-primary-50', iconColor = 'text-primary-600' }) => (
  <Card className="p-5 flex items-center gap-4 hover:shadow-card transition-shadow">
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      <Icon size={22} className={iconColor} strokeWidth={2} />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-slate-500 truncate">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </Card>
);
