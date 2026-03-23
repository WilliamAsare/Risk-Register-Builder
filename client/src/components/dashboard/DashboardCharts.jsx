import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RISK_COLORS } from '../../utils/constants';

export default function DashboardCharts({ registers }) {
  let totalRisks = 0;
  let totalCritical = 0;
  registers.forEach(r => {
    totalRisks += r.risk_count || 0;
    totalCritical += r.critical_count || 0;
  });

  // Risk count per register for bar chart
  const barData = registers.map(r => ({
    name: r.name.length > 15 ? r.name.substring(0, 15) + '...' : r.name,
    total: r.risk_count || 0,
    critical: r.critical_count || 0,
  }));

  if (registers.length === 0 || totalRisks === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Risk overview donut */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk Overview</h3>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Critical', value: totalCritical },
                  { name: 'Other', value: totalRisks - totalCritical },
                ].filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                <Cell fill={RISK_COLORS.critical} />
                <Cell fill="#94A3B8" />
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2">
          <span className="text-3xl font-bold text-slate-900">{totalRisks}</span>
          <span className="text-sm text-slate-500 ml-2">total risks</span>
        </div>
      </div>

      {/* Risks per register bar chart */}
      {barData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Risks by Register</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" name="Total Risks" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="critical" name="Critical" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
