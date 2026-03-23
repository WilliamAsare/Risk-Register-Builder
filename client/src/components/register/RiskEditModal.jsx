import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input, { Select, Textarea } from '../common/Input';
import Badge from '../common/Badge';
import { api } from '../../utils/api';
import { getRiskLevel, getRiskLabel, getRiskColor, LIKELIHOOD_LABELS, IMPACT_LABELS } from '../../utils/riskCalculations';
import toast from 'react-hot-toast';

export default function RiskEditModal({ risk, registerId, assets, threats, controls, existingRisks, onClose, onSaved }) {
  const isNew = risk && !risk.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(getDefaultForm());

  useEffect(() => {
    if (risk) {
      if (risk.id) {
        setForm({
          risk_id_label: risk.risk_id_label,
          title: risk.title,
          description: risk.description || '',
          asset_id: risk.asset_id || '',
          threat_id: risk.threat_id || '',
          risk_category: risk.risk_category,
          inherent_likelihood: risk.inherent_likelihood,
          inherent_impact: risk.inherent_impact,
          residual_likelihood: risk.residual_likelihood,
          residual_impact: risk.residual_impact,
          treatment: risk.treatment,
          treatment_plan: risk.treatment_plan || '',
          risk_owner: risk.risk_owner || '',
          due_date: risk.due_date || '',
          status: risk.status,
          control_ids: (risk.controls || []).map(c => c.id),
        });
      } else {
        const nextNum = (existingRisks?.length || 0) + 1;
        setForm({ ...getDefaultForm(), risk_id_label: `R-${String(nextNum).padStart(3, '0')}` });
      }
    }
  }, [risk]);

  function getDefaultForm() {
    return {
      risk_id_label: '', title: '', description: '',
      asset_id: '', threat_id: '', risk_category: 'cyber',
      inherent_likelihood: 3, inherent_impact: 3,
      residual_likelihood: 2, residual_impact: 2,
      treatment: 'mitigate', treatment_plan: '', risk_owner: '', due_date: '', status: 'open',
      control_ids: [],
    };
  }

  const handleSave = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (isNew) {
        await api.post(`/registers/${registerId}/risks`, form);
        toast.success('Risk created');
      } else {
        await api.put(`/registers/${registerId}/risks/${risk.id}`, form);
        toast.success('Risk updated');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!risk) return null;

  const iScore = form.inherent_likelihood * form.inherent_impact;
  const rScore = form.residual_likelihood * form.residual_impact;

  return (
    <Modal isOpen={!!risk} onClose={onClose} title={isNew ? 'Add Risk' : 'Edit Risk'} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Risk ID" value={form.risk_id_label} onChange={e => setForm({ ...form, risk_id_label: e.target.value })} />
          <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <Select label="Asset" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value ? Number(e.target.value) : '' })}>
            <option value="">- None -</option>
            {(assets || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Select label="Threat" value={form.threat_id} onChange={e => setForm({ ...form, threat_id: e.target.value ? Number(e.target.value) : '' })}>
            <option value="">- None -</option>
            {(threats || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Select label="Category" value={form.risk_category} onChange={e => setForm({ ...form, risk_category: e.target.value })}>
            <option value="cyber">Cyber</option>
            <option value="operational">Operational</option>
            <option value="compliance">Compliance</option>
            <option value="strategic">Strategic</option>
            <option value="third_party">Third Party</option>
          </Select>
          <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
            <option value="accepted">Accepted</option>
          </Select>
        </div>

        <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

        {/* Risk Ratings */}
        <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Inherent Risk</h4>
            <RatingRow label="Likelihood" value={form.inherent_likelihood} onChange={v => setForm({ ...form, inherent_likelihood: v })} labels={LIKELIHOOD_LABELS} />
            <RatingRow label="Impact" value={form.inherent_impact} onChange={v => setForm({ ...form, inherent_impact: v })} labels={IMPACT_LABELS} />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold" style={{ color: getRiskColor(iScore) }}>{iScore}</span>
              <Badge color={getRiskLevel(iScore)}>{getRiskLabel(iScore)}</Badge>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Residual Risk</h4>
            <RatingRow label="Likelihood" value={form.residual_likelihood} onChange={v => setForm({ ...form, residual_likelihood: v })} labels={LIKELIHOOD_LABELS} />
            <RatingRow label="Impact" value={form.residual_impact} onChange={v => setForm({ ...form, residual_impact: v })} labels={IMPACT_LABELS} />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold" style={{ color: getRiskColor(rScore) }}>{rScore}</span>
              <Badge color={getRiskLevel(rScore)}>{getRiskLabel(rScore)}</Badge>
            </div>
          </div>
        </div>

        {/* Controls */}
        {controls && controls.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Controls</label>
            <div className="flex flex-wrap gap-2">
              {controls.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    const ids = form.control_ids.includes(c.id)
                      ? form.control_ids.filter(id => id !== c.id)
                      : [...form.control_ids, c.id];
                    setForm({ ...form, control_ids: ids });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    form.control_ids.includes(c.id)
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-navy-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Select label="Treatment" value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })}>
            <option value="mitigate">Mitigate</option>
            <option value="accept">Accept</option>
            <option value="transfer">Transfer</option>
            <option value="avoid">Avoid</option>
          </Select>
          <Input label="Risk Owner" value={form.risk_owner} onChange={e => setForm({ ...form, risk_owner: e.target.value })} />
          <Input label="Due Date" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
        </div>

        <Textarea label="Treatment Plan" value={form.treatment_plan} onChange={e => setForm({ ...form, treatment_plan: e.target.value })} />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : isNew ? 'Create Risk' : 'Save Changes'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function RatingRow({ label, value, onChange, labels }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-slate-500 mb-1">{label}: <span className="font-medium text-slate-700">{value} - {labels[value]}</span></div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`w-9 h-7 rounded text-xs font-medium transition-all ${
              v === value ? 'bg-navy text-white scale-110 shadow' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
