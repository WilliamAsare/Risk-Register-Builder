import { useState } from 'react';
import { SlideOver } from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import RiskComments from './RiskComments';
import RiskHistory from './RiskHistory';
import { api } from '../../utils/api';
import { getRiskLevel, getRiskLabel, getRiskColor, LIKELIHOOD_LABELS, IMPACT_LABELS } from '../../utils/riskCalculations';
import toast from 'react-hot-toast';

export default function RiskDetailPanel({ risk, registerId, onClose, onEdit, onDelete, onUpdated }) {
  const [activeTab, setActiveTab] = useState('details');
  const [editingPlan, setEditingPlan] = useState(false);
  const [planText, setPlanText] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  if (!risk) return null;

  const iScore = risk.inherent_risk_score;
  const rScore = risk.residual_risk_score;
  const reduction = iScore > 0 ? Math.round((1 - rScore / iScore) * 100) : 0;

  return (
    <SlideOver isOpen={!!risk} onClose={onClose} title={`${risk.risk_id_label} - ${risk.title}`}>
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onEdit(risk)}>Edit Risk</Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(risk.id)}>Delete</Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 -mx-6 px-6">
          {['details', 'comments', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-navy text-navy'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'comments' && registerId && (
          <div className="animate-fade-in">
            <RiskComments registerId={registerId} riskId={risk.id} />
          </div>
        )}

        {activeTab === 'history' && registerId && (
          <div className="animate-fade-in">
            <RiskHistory registerId={registerId} riskId={risk.id} />
          </div>
        )}

        {activeTab === 'details' && <>
        {/* Status and Category */}
        <div className="flex gap-2 flex-wrap">
          <Badge color={risk.status}>{risk.status?.replace(/_/g, ' ')}</Badge>
          <Badge>{risk.risk_category?.replace(/_/g, ' ')}</Badge>
          <Badge>{risk.treatment}</Badge>
        </div>

        {/* Description */}
        {risk.description && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Description</h4>
            <p className="text-sm text-slate-600">{risk.description}</p>
          </div>
        )}

        {/* Asset & Threat */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Asset</h4>
            <p className="text-sm text-slate-600">{risk.asset_name || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Threat</h4>
            <p className="text-sm text-slate-600">{risk.threat_name || 'N/A'}</p>
          </div>
        </div>

        {/* Risk Scores Comparison */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Risk Score Comparison</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-xs text-slate-500 mb-2">Inherent Risk</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: getRiskColor(iScore) }}>{iScore}</span>
                <Badge color={getRiskLevel(iScore)}>{getRiskLabel(iScore)}</Badge>
              </div>
              <div className="text-xs text-slate-500">
                Likelihood: {risk.inherent_likelihood} ({LIKELIHOOD_LABELS[risk.inherent_likelihood]})
              </div>
              <div className="text-xs text-slate-500">
                Impact: {risk.inherent_impact} ({IMPACT_LABELS[risk.inherent_impact]})
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-xs text-slate-500 mb-2">Residual Risk</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: getRiskColor(rScore) }}>{rScore}</span>
                <Badge color={getRiskLevel(rScore)}>{getRiskLabel(rScore)}</Badge>
              </div>
              <div className="text-xs text-slate-500">
                Likelihood: {risk.residual_likelihood} ({LIKELIHOOD_LABELS[risk.residual_likelihood]})
              </div>
              <div className="text-xs text-slate-500">
                Impact: {risk.residual_impact} ({IMPACT_LABELS[risk.residual_impact]})
              </div>
            </div>
          </div>
          {/* Reduction bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Risk Reduction</span>
              <span>{reduction}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${reduction}%` }} />
            </div>
          </div>
        </div>

        {/* Controls */}
        {risk.controls && risk.controls.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Linked Controls ({risk.controls.length})</h4>
            <div className="space-y-2">
              {risk.controls.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                  <div>
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-xs text-slate-500 ml-2 capitalize">{c.type}</span>
                  </div>
                  <Badge color={c.effectiveness === 'strong' ? 'low' : c.effectiveness === 'moderate' ? 'medium' : 'high'}>
                    {c.effectiveness}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Treatment Plan */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Treatment Plan
            </h4>
            {!editingPlan && (
              <button
                onClick={() => { setEditingPlan(true); setPlanText(risk.treatment_plan || ''); }}
                className="text-xs text-navy hover:underline"
              >
                {risk.treatment_plan ? 'Edit' : '+ Add Plan'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Treatment</div>
              <div className="text-sm font-medium capitalize">{risk.treatment}</div>
            </div>
            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Owner</div>
              <div className="text-sm font-medium">{risk.risk_owner || 'Unassigned'}</div>
            </div>
            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Due Date</div>
              <div className="text-sm font-medium">{risk.due_date ? new Date(risk.due_date).toLocaleDateString() : 'Not set'}</div>
            </div>
          </div>

          {editingPlan ? (
            <div className="space-y-2">
              <textarea
                value={planText}
                onChange={e => setPlanText(e.target.value)}
                rows={4}
                placeholder="Describe the treatment plan, action items, milestones..."
                className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy resize-none"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="secondary" onClick={() => setEditingPlan(false)}>Cancel</Button>
                <Button size="sm" disabled={savingPlan} onClick={async () => {
                  setSavingPlan(true);
                  try {
                    await api.put(`/registers/${registerId}/risks/${risk.id}`, { treatment_plan: planText });
                    toast.success('Treatment plan updated');
                    setEditingPlan(false);
                    onUpdated?.();
                  } catch {
                    toast.error('Failed to save');
                  } finally {
                    setSavingPlan(false);
                  }
                }}>{savingPlan ? 'Saving...' : 'Save Plan'}</Button>
              </div>
            </div>
          ) : risk.treatment_plan ? (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200 whitespace-pre-wrap">{risk.treatment_plan}</div>
          ) : (
            <p className="text-sm text-slate-400 italic">No treatment plan documented yet.</p>
          )}
        </div>
        </>}
      </div>
    </SlideOver>
  );
}
