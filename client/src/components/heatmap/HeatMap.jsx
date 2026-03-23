import { useState } from 'react';
import { getRiskColor, getRiskLevel, LIKELIHOOD_LABELS, IMPACT_LABELS } from '../../utils/riskCalculations';

export default function HeatMap({ risks = [], showAppetite = true }) {
  const [view, setView] = useState('inherent');
  const [appetiteThreshold, setAppetiteThreshold] = useState(8); // Default: scores >= 8 are above appetite

  const getCount = (likelihood, impact) => {
    return risks.filter(r => {
      const l = view === 'inherent' ? r.inherent_likelihood : r.residual_likelihood;
      const i = view === 'inherent' ? r.inherent_impact : r.residual_impact;
      return l === likelihood && i === impact;
    });
  };

  return (
    <div>
      {/* Toggle + Controls */}
      <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('inherent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'inherent' ? 'bg-navy text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Inherent Risk
          </button>
          <button
            onClick={() => setView('residual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'residual' ? 'bg-navy text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Residual Risk
          </button>
        </div>

        {showAppetite && (
          <div className="flex items-center gap-2 ml-4">
            <label className="text-xs text-slate-500">Risk Appetite:</label>
            <select
              value={appetiteThreshold}
              onChange={e => setAppetiteThreshold(Number(e.target.value))}
              className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
            >
              <option value={4}>Conservative (4+)</option>
              <option value={8}>Moderate (8+)</option>
              <option value={16}>Aggressive (16+)</option>
            </select>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mb-4 text-xs flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Low (1-3)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500" /> Medium (4-7)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500" /> High (8-15)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Critical (16-25)</span>
        {showAppetite && (
          <span className="flex items-center gap-1">
            <span className="w-6 h-3 border-2 border-dashed border-slate-800 rounded" /> Risk Appetite
          </span>
        )}
      </div>

      <div className="flex justify-center">
        <div className="inline-block">
          {/* Y-axis label */}
          <div className="flex">
            <div className="w-8 flex items-center justify-center">
              <span className="text-xs text-slate-500 font-medium -rotate-90 whitespace-nowrap">Likelihood</span>
            </div>
            <div className="flex flex-col">
              {/* Grid rows: likelihood 5 down to 1 */}
              {[5, 4, 3, 2, 1].map(likelihood => (
                <div key={likelihood} className="flex items-center">
                  <div className="w-28 pr-2 text-right">
                    <span className="text-xs text-slate-600 font-medium">{likelihood} - {LIKELIHOOD_LABELS[likelihood]}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(impact => {
                      const score = likelihood * impact;
                      const cellRisks = getCount(likelihood, impact);
                      const isAboveAppetite = showAppetite && score >= appetiteThreshold;
                      return (
                        <HeatMapCell
                          key={`${likelihood}-${impact}`}
                          score={score}
                          risks={cellRisks}
                          isAboveAppetite={isAboveAppetite}
                          appetiteThreshold={appetiteThreshold}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              {/* X-axis labels */}
              <div className="flex ml-28 mt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(impact => (
                    <div key={impact} className="w-20 text-center">
                      <span className="text-xs text-slate-600 font-medium">{impact} - {IMPACT_LABELS[impact]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center ml-28 mt-1">
                <span className="text-xs text-slate-500 font-medium">Impact</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {risks.length > 0 && showAppetite && (
        <div className="mt-4 flex justify-center">
          <div className="flex gap-4 text-xs">
            <span className="text-slate-500">
              Above appetite:{' '}
              <span className="font-bold text-red-600">
                {risks.filter(r => {
                  const s = view === 'inherent'
                    ? r.inherent_likelihood * r.inherent_impact
                    : r.residual_likelihood * r.residual_impact;
                  return s >= appetiteThreshold;
                }).length}
              </span>
            </span>
            <span className="text-slate-500">
              Within appetite:{' '}
              <span className="font-bold text-green-600">
                {risks.filter(r => {
                  const s = view === 'inherent'
                    ? r.inherent_likelihood * r.inherent_impact
                    : r.residual_likelihood * r.residual_impact;
                  return s < appetiteThreshold;
                }).length}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function HeatMapCell({ score, risks, isAboveAppetite, appetiteThreshold }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const color = getRiskColor(score);
  const level = getRiskLevel(score);
  const bgOpacity = risks.length > 0 ? '1' : '0.6';

  return (
    <div
      className={`relative w-20 h-16 rounded-lg flex flex-col items-center justify-center cursor-default transition-transform hover:scale-105 ${
        isAboveAppetite ? 'ring-2 ring-slate-800 ring-dashed' : ''
      }`}
      style={{ backgroundColor: color, opacity: bgOpacity }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-white text-xs font-bold">{score}</span>
      {risks.length > 0 && (
        <div className="flex gap-0.5 mt-1">
          {risks.slice(0, 5).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-white/80" />
          ))}
          {risks.length > 5 && <span className="text-white text-[9px] ml-0.5">+{risks.length - 5}</span>}
        </div>
      )}
      {risks.length > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-xs font-bold rounded-full flex items-center justify-center shadow" style={{ color }}>
          {risks.length}
        </span>
      )}

      {showTooltip && risks.length > 0 && (
        <div className="absolute z-30 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
          {risks.map((r, i) => (
            <div key={i} className="py-0.5">{r.risk_id_label || r.title || `Risk ${i + 1}`}</div>
          ))}
          {isAboveAppetite && <div className="pt-1 mt-1 border-t border-white/20 text-red-300 font-medium">Above risk appetite</div>}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
        </div>
      )}
    </div>
  );
}
