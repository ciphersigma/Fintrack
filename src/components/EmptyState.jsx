// Consistent empty-state block: emoji, title, optional subtitle and action.
export default function EmptyState({ emoji = "📭", title, subtitle, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <span className="text-4xl mb-3">{emoji}</span>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
