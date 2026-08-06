export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  loading = false,
}) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">
          {Icon && <Icon size={20} />}
        </div>

        <span className="stat-indicator">
          Live
        </span>
      </div>

      <div className="stat-value">
        {loading ? "—" : value ?? 0}
      </div>

      <div className="stat-label">
        {title}
      </div>

      {description && (
        <div className="stat-detail">
          {description}
        </div>
      )}
    </article>
  );
}