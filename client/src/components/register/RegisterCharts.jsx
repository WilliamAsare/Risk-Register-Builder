import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getRiskLevel } from '../../utils/riskCalculations';
import { RISK_COLORS } from '../../utils/constants';

const TREATMENT_COLORS = {
  mitigate: '#3B82F6',
  accept: '#8B5CF6',
  transfer: '#F59E0B',
  avoid: '#EF4444',
};

const STATUS_COLORS = {
  open: '#3B82F6',
  in_progress: '#8B5CF6',
  closed: '#64748B',
  accepted: '#14B8A6',
};

export default function RegisterCharts({ risks = [] }) {
  if (risks.length === 0) return null;

  // Risk level distribution
  const distribution = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  risks.forEach(r => {
    const level = getRiskLevel(r.inherent_risk_score);
    const label = level.charAt(0).toUpperCase() + level.slice(1);
    distribution[label]++;
  });

  const distData = Object.entries(distribution)
    .map(([name, value]) => ({ name, value, color: RISK_COLORS[name.toLowerCase()] }))
    .filter(d => d.value > 0);

  // Treatment breakdown
  const treatmentMap = {};
  risks.forEach(r => {
    const t = r.treatment || 'mitigate';
    treatmentMap[t] = (treatmentMap[t] || 0) + 1;
  });
  const treatmentData = Object.entries(treatmentMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: TREATMENT_COLORS[name] || '#64748B',
  }));

  // Status breakdown
  const statusMap = {};
  risks.forEach(r => {
    const s = r.status || 'open';
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
    value,
    color: STATUS_COLORS[name] || '#64748B',
  }));

  // Inherent vs Residual comparison
  const comparisonData = risks
    .sort((a, b) => b.inherent_risk_score - a.inherent_risk_score)
    .slice(0, 10)
    .map(r => ({
      name: r.risk_id_label || r.title.substring(0, 12),
      inherent: r.inherent_risk_score,
      residual: r.residual_risk_score,
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Level Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Risk Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={distData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {distData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Treatment Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">By Treatment</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={treatmentData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {treatmentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">By Status</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inherent vs Residual Comparison */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Inherent vs Residual Risk (Top 10)</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={comparisonData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 25]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="inherent" name="Inherent Risk" fill="#F97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="residual" name="Residual Risk" fill="#22C55E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Score Changes Summary */}
      {(() => {
        const scoreChanges = risks.filter(r => r.inherent_risk_score !== r.residual_risk_score);
        const improved = scoreChanges.filter(r => r.residual_risk_score < r.inherent_risk_score);
        const avgReduction = improved.length
          ? Math.round(improved.reduce((sum, r) => sum + ((1 - r.residual_risk_score / r.inherent_risk_score) * 100), 0) / improved.length)
          : 0;
        const untreated = risks.filter(r => r.inherent_risk_score === r.residual_risk_score);
        const criticalUntreated = untreated.filter(r => r.inherent_risk_score >= 16);

        return (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Reassessment Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{improved.length}</div>
                <div className="text-xs text-green-600">Risks Improved</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{avgReduction}%</div>
                <div className="text-xs text-blue-600">Avg Reduction</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-2xl font-bold text-amber-700">{untreated.length}</div>
                <div className="text-xs text-amber-600">No Change</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-700">{criticalUntreated.length}</div>
                <div className="text-xs text-red-600">Critical Untreated</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
