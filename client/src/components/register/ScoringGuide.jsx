import { getRiskColor, LIKELIHOOD_LABELS, IMPACT_LABELS } from '../../utils/riskCalculations';

export default function ScoringGuide({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Risk Scoring Methodology
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Overview */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2">How Risk Scoring Works</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Risk scores are calculated using a simple multiplication formula:
              <span className="inline-block bg-navy/10 text-navy font-mono text-xs px-2 py-1 rounded ml-1">
                Risk Score = Likelihood x Impact
              </span>
            </p>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Both Likelihood and Impact are rated on a 1-5 scale, producing scores from 1 (minimum) to 25 (maximum).
              Each risk is assessed twice: <strong>Inherent Risk</strong> (before controls) and <strong>Residual Risk</strong> (after controls).
            </p>
          </section>

          {/* Likelihood Scale */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Likelihood Scale</h3>
            <div className="space-y-1">
              {Object.entries(LIKELIHOOD_LABELS).map(([val, label]) => (
                <div key={val} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="w-7 h-7 bg-navy text-white rounded-lg flex items-center justify-center text-xs font-bold">{val}</span>
                  <span className="font-medium text-sm text-slate-800 w-28">{label}</span>
                  <span className="text-xs text-slate-500">
                    {val === '1' && 'May occur only in exceptional circumstances'}
                    {val === '2' && 'Could occur at some time; not expected'}
                    {val === '3' && 'Might occur; has happened before in similar contexts'}
                    {val === '4' && 'Will probably occur in most circumstances'}
                    {val === '5' && 'Expected to occur; virtually certain'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Impact Scale */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Impact Scale</h3>
            <div className="space-y-1">
              {Object.entries(IMPACT_LABELS).map(([val, label]) => (
                <div key={val} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="w-7 h-7 bg-navy text-white rounded-lg flex items-center justify-center text-xs font-bold">{val}</span>
                  <span className="font-medium text-sm text-slate-800 w-28">{label}</span>
                  <span className="text-xs text-slate-500">
                    {val === '1' && 'Negligible effect on operations or objectives'}
                    {val === '2' && 'Minor disruption; quickly recoverable'}
                    {val === '3' && 'Noticeable effect; requires management attention'}
                    {val === '4' && 'Significant harm to operations, finances, or reputation'}
                    {val === '5' && 'Catastrophic; threatens organizational survival'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Risk Levels */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Risk Level Thresholds</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { level: 'Low', range: '1-3', color: '#22C55E', desc: 'Accept or monitor. Routine management.' },
                { level: 'Medium', range: '4-7', color: '#EAB308', desc: 'Review and implement proportionate controls.' },
                { level: 'High', range: '8-15', color: '#F97316', desc: 'Prioritize treatment. Senior management attention.' },
                { level: 'Critical', range: '16-25', color: '#DC2626', desc: 'Immediate action required. Executive oversight.' },
              ].map(item => (
                <div key={item.level} className="flex items-start gap-3 bg-slate-50 rounded-lg px-3 py-3 border border-slate-100">
                  <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{item.level} ({item.range})</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mini heat map reference */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Score Reference Grid</h3>
            <div className="flex justify-center">
              <div className="inline-grid grid-cols-5 gap-1">
                {[5, 4, 3, 2, 1].map(l =>
                  [1, 2, 3, 4, 5].map(i => {
                    const score = l * i;
                    return (
                      <div
                        key={`${l}-${i}`}
                        className="w-12 h-10 rounded flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: getRiskColor(score) }}
                      >
                        {score}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {/* Treatment Options */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Treatment Options</h3>
            <div className="space-y-2">
              {[
                { name: 'Mitigate', desc: 'Implement controls to reduce likelihood and/or impact', icon: '🛡' },
                { name: 'Accept', desc: 'Acknowledge the risk without additional action; within appetite', icon: '✓' },
                { name: 'Transfer', desc: 'Shift risk to a third party (insurance, outsourcing)', icon: '→' },
                { name: 'Avoid', desc: 'Eliminate the risk by stopping the activity or changing approach', icon: '✕' },
              ].map(t => (
                <div key={t.name} className="flex items-start gap-3 text-sm">
                  <span className="text-lg">{t.icon}</span>
                  <div>
                    <span className="font-medium text-slate-800">{t.name}:</span>{' '}
                    <span className="text-slate-600">{t.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
