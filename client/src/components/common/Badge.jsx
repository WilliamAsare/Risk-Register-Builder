const colorMap = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  closed: 'bg-slate-100 text-slate-700',
  accepted: 'bg-teal-100 text-teal-700',
  default: 'bg-slate-100 text-slate-600',
};

export default function Badge({ children, color = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[color] || colorMap.default} ${className}`}>
      {children}
    </span>
  );
}
