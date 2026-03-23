import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { FRAMEWORK_DATA, getRiskLevel, getRiskLabel, getRiskColor, LIKELIHOOD_LABELS, IMPACT_LABELS } from '../utils/riskCalculations';
import Button from '../components/common/Button';
import Input, { Select, Textarea } from '../components/common/Input';
import Badge from '../components/common/Badge';
import HeatMap from '../components/heatmap/HeatMap';
import toast from 'react-hot-toast';

const STEPS = ['Register Info', 'Assets', 'Threats', 'Controls', 'Risk Assessment', 'Review'];

export default function NewRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [registerInfo, setRegisterInfo] = useState({ name: '', description: '', framework: 'general' });
  const [assets, setAssets] = useState([]);
  const [threats, setThreats] = useState([]);
  const [controls, setControls] = useState([]);
  const [risks, setRisks] = useState([]);

  const next = () => setStep(s => Math.min(s + 1, 5));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleFrameworkChange = (fw) => {
    setRegisterInfo(prev => ({ ...prev, framework: fw }));
    if (fw !== 'general' && FRAMEWORK_DATA[fw]) {
      const data = FRAMEWORK_DATA[fw];
      if (assets.length === 0) setAssets(data.assets.map((a, i) => ({ ...a, _id: `a-${i}`, owner: '', description: '' })));
      if (threats.length === 0) setThreats(data.threats.map((t, i) => ({ ...t, _id: `t-${i}`, description: '' })));
      if (controls.length === 0) setControls(data.controls.map((c, i) => ({ ...c, _id: `c-${i}`, owner: '', description: '' })));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const reg = await api.post('/registers', registerInfo);
      const regId = reg.id;

      const assetMap = {};
      for (const a of assets) {
        const created = await api.post(`/registers/${regId}/assets`, a);
        assetMap[a._id] = created.id;
      }

      const threatMap = {};
      for (const t of threats) {
        const created = await api.post(`/registers/${regId}/threats`, t);
        threatMap[t._id] = created.id;
      }

      const controlMap = {};
      for (const c of controls) {
        const created = await api.post(`/registers/${regId}/controls`, c);
        controlMap[c._id] = created.id;
      }

      for (const r of risks) {
        await api.post(`/registers/${regId}/risks`, {
          ...r,
          asset_id: r.asset_id ? assetMap[r.asset_id] : null,
          threat_id: r.threat_id ? threatMap[r.threat_id] : null,
          control_ids: (r.control_ids || []).map(cid => controlMap[cid]).filter(Boolean),
        });
      }

      toast.success('Risk register created!');
      navigate(`/registers/${regId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-white/70 hover:text-white">
              ← Back
            </button>
            <span className="font-bold">New Risk Register</span>
          </div>
          <span className="text-sm text-white/60">Step {step + 1} of {STEPS.length}</span>
        </div>
        {/* Progress bar */}
        <div className="max-w-5xl mx-auto px-6 pb-4">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => i <= step && setStep(i)}
                className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-white' : 'bg-white/20'}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <span key={i} className={`text-xs ${i === step ? 'text-white font-medium' : 'text-white/40'}`}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {step === 0 && <Step1 data={registerInfo} onChange={setRegisterInfo} onFrameworkChange={handleFrameworkChange} />}
        {step === 1 && <Step2 items={assets} onChange={setAssets} />}
        {step === 2 && <Step3 items={threats} onChange={setThreats} />}
        {step === 3 && <Step4 items={controls} onChange={setControls} />}
        {step === 4 && <Step5 risks={risks} onChange={setRisks} assets={assets} threats={threats} controls={controls} />}
        {step === 5 && <Step6 registerInfo={registerInfo} assets={assets} threats={threats} controls={controls} risks={risks} />}

        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          <Button variant="secondary" onClick={step === 0 ? () => navigate('/dashboard') : prev}>
            {step === 0 ? 'Cancel' : '← Previous'}
          </Button>
          {step < 5 ? (
            <Button onClick={next} disabled={step === 0 && !registerInfo.name}>
              Next →
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving || risks.length === 0}>
              {saving ? 'Saving...' : 'Create Risk Register'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Step 1: Register Info */
function Step1({ data, onChange, onFrameworkChange }) {
  return (
    <div className="max-w-xl animate-fade-in">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Register Information</h2>
      <p className="text-slate-500 mb-6">Name your risk register and optionally select a framework template. Framework templates provide suggested assets, threats, and controls that you can customize.</p>

      <div className="space-y-4">
        <Input label="Register Name" value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} placeholder="e.g., Q1 2026 Enterprise Risk Assessment" required />
        <Textarea label="Description" value={data.description} onChange={e => onChange({ ...data, description: e.target.value })} placeholder="Brief description of this risk register's scope..." />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Framework</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'nist_csf', label: 'NIST CSF 2.0', desc: 'Cybersecurity framework' },
              { value: 'iso_27001', label: 'ISO 27001', desc: 'Information security' },
              { value: 'sox_itgc', label: 'SOX ITGC', desc: 'IT general controls' },
              { value: 'general', label: 'General', desc: 'Start from scratch' },
            ].map(fw => (
              <button
                key={fw.value}
                type="button"
                onClick={() => onFrameworkChange(fw.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  data.framework === fw.value
                    ? 'border-navy bg-navy-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-medium text-slate-900">{fw.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{fw.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Step 2: Assets */
function Step2({ items, onChange }) {
  const [form, setForm] = useState({ name: '', type: 'application', owner: '', criticality: 'medium', description: '' });

  const add = () => {
    if (!form.name) return;
    onChange([...items, { ...form, _id: `a-${Date.now()}` }]);
    setForm({ name: '', type: 'application', owner: '', criticality: 'medium', description: '' });
  };

  const remove = (id) => onChange(items.filter(i => i._id !== id));

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Assets</h2>
      <p className="text-slate-500 mb-6">Identify the assets within scope. {items.length > 0 && `${items.length} assets added.`}</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Asset Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Cloud Infrastructure" />
          <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="application">Application</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="data">Data</option>
            <option value="people">People</option>
            <option value="process">Process</option>
          </Select>
          <Input label="Owner" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} placeholder="Team or individual" />
          <Select label="Criticality" value={form.criticality} onChange={e => setForm({ ...form, criticality: e.target.value })}>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>
        <Button onClick={add} disabled={!form.name} size="sm">+ Add Asset</Button>
      </div>

      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Owner</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Criticality</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 capitalize">{item.type}</td>
                  <td className="px-4 py-3">{item.owner || '-'}</td>
                  <td className="px-4 py-3"><Badge color={item.criticality === 'critical' ? 'critical' : item.criticality}>{item.criticality}</Badge></td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(item._id)} className="text-slate-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* Step 3: Threats */
function Step3({ items, onChange }) {
  const [form, setForm] = useState({ name: '', category: 'cyber', source: 'external', description: '' });

  const add = () => {
    if (!form.name) return;
    onChange([...items, { ...form, _id: `t-${Date.now()}` }]);
    setForm({ name: '', category: 'cyber', source: 'external', description: '' });
  };

  const remove = (id) => onChange(items.filter(i => i._id !== id));

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Threats</h2>
      <p className="text-slate-500 mb-6">Identify threats that could exploit vulnerabilities. {items.length > 0 && `${items.length} threats added.`}</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Threat Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Ransomware Attack" />
          <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            <option value="cyber">Cyber</option>
            <option value="operational">Operational</option>
            <option value="compliance">Compliance</option>
            <option value="strategic">Strategic</option>
            <option value="third_party">Third Party</option>
          </Select>
          <Select label="Source" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
            <option value="external">External</option>
            <option value="internal">Internal</option>
            <option value="environmental">Environmental</option>
          </Select>
        </div>
        <Button onClick={add} disabled={!form.name} size="sm">+ Add Threat</Button>
      </div>

      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Source</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 capitalize">{item.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 capitalize">{item.source}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(item._id)} className="text-slate-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* Step 4: Controls */
function Step4({ items, onChange }) {
  const [form, setForm] = useState({ name: '', type: 'preventive', category: 'technical', effectiveness: 'moderate', owner: '', description: '' });

  const add = () => {
    if (!form.name) return;
    onChange([...items, { ...form, _id: `c-${Date.now()}` }]);
    setForm({ name: '', type: 'preventive', category: 'technical', effectiveness: 'moderate', owner: '', description: '' });
  };

  const remove = (id) => onChange(items.filter(i => i._id !== id));

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Controls</h2>
      <p className="text-slate-500 mb-6">Document existing controls that mitigate risks. {items.length > 0 && `${items.length} controls added.`}</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Control Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., MFA Enforcement" />
          <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="preventive">Preventive</option>
            <option value="detective">Detective</option>
            <option value="corrective">Corrective</option>
            <option value="compensating">Compensating</option>
          </Select>
          <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            <option value="technical">Technical</option>
            <option value="administrative">Administrative</option>
            <option value="physical">Physical</option>
          </Select>
          <Select label="Effectiveness" value={form.effectiveness} onChange={e => setForm({ ...form, effectiveness: e.target.value })}>
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
            <option value="weak">Weak</option>
            <option value="not_implemented">Not Implemented</option>
          </Select>
          <Input label="Owner" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} placeholder="Team or individual" />
        </div>
        <Button onClick={add} disabled={!form.name} size="sm">+ Add Control</Button>
      </div>

      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Effectiveness</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 capitalize">{item.type}</td>
                  <td className="px-4 py-3 capitalize">{item.category}</td>
                  <td className="px-4 py-3">
                    <Badge color={item.effectiveness === 'strong' ? 'low' : item.effectiveness === 'moderate' ? 'medium' : 'high'}>
                      {item.effectiveness}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(item._id)} className="text-slate-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* Step 5: Risk Assessment (with Quick-Add and Detail modes) */
function Step5({ risks, onChange, assets, threats, controls }) {
  const [mode, setMode] = useState('quick'); // 'quick' or 'detail'
  const nextLabel = `R-${String(risks.length + 1).padStart(3, '0')}`;

  const emptyRisk = {
    risk_id_label: nextLabel, title: '', description: '',
    asset_id: '', threat_id: '', risk_category: 'cyber',
    inherent_likelihood: 3, inherent_impact: 3,
    residual_likelihood: 2, residual_impact: 2,
    treatment: 'mitigate', treatment_plan: '', risk_owner: '', due_date: '', status: 'open',
    control_ids: [],
  };

  const [form, setForm] = useState(emptyRisk);

  const addRisk = () => {
    if (!form.title) return;
    onChange([...risks, { ...form, _id: `r-${Date.now()}` }]);
    const nextNum = risks.length + 2;
    setForm({ ...emptyRisk, risk_id_label: `R-${String(nextNum).padStart(3, '0')}` });
  };

  const removeRisk = (id) => onChange(risks.filter(r => r._id !== id));

  const iScore = form.inherent_likelihood * form.inherent_impact;
  const rScore = form.residual_likelihood * form.residual_impact;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-slate-900">Risk Assessment</h2>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          <button onClick={() => setMode('quick')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'quick' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>
            Quick Add
          </button>
          <button onClick={() => setMode('detail')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'detail' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>
            Detail Mode
          </button>
        </div>
      </div>
      <p className="text-slate-500 mb-6">
        {mode === 'quick' ? 'Rapidly add risks with essential fields. Use Detail Mode for full form.' : 'Full risk entry with all fields.'}
        {risks.length > 0 && ` ${risks.length} risks added.`}
      </p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        {mode === 'quick' ? (
          /* Quick-Add Mode */
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-24">
                <Input label="ID" value={form.risk_id_label} onChange={e => setForm({ ...form, risk_id_label: e.target.value })} />
              </div>
              <div className="flex-1">
                <Input label="Risk Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Describe the risk..." />
              </div>
            </div>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="w-36">
                <Select label="Category" value={form.risk_category} onChange={e => setForm({ ...form, risk_category: e.target.value })}>
                  <option value="cyber">Cyber</option>
                  <option value="operational">Operational</option>
                  <option value="compliance">Compliance</option>
                  <option value="strategic">Strategic</option>
                  <option value="third_party">Third Party</option>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Inherent (L x I)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, inherent_likelihood: v })}
                      className={`w-7 h-7 rounded text-xs font-medium ${form.inherent_likelihood === v ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600'}`}>{v}</button>
                  ))}
                  <span className="text-slate-300 self-center mx-0.5">x</span>
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, inherent_impact: v })}
                      className={`w-7 h-7 rounded text-xs font-medium ${form.inherent_impact === v ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600'}`}>{v}</button>
                  ))}
                  <span className="text-xs font-bold ml-1 self-center" style={{ color: getRiskColor(iScore) }}>{iScore}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Residual (L x I)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, residual_likelihood: v })}
                      className={`w-7 h-7 rounded text-xs font-medium ${form.residual_likelihood === v ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{v}</button>
                  ))}
                  <span className="text-slate-300 self-center mx-0.5">x</span>
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, residual_impact: v })}
                      className={`w-7 h-7 rounded text-xs font-medium ${form.residual_impact === v ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{v}</button>
                  ))}
                  <span className="text-xs font-bold ml-1 self-center" style={{ color: getRiskColor(rScore) }}>{rScore}</span>
                </div>
              </div>
              <Button onClick={addRisk} disabled={!form.title} size="sm">+ Add</Button>
            </div>
          </div>
        ) : (
          /* Detail Mode (original full form) */
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input label="Risk ID" value={form.risk_id_label} onChange={e => setForm({ ...form, risk_id_label: e.target.value })} />
              <Input label="Risk Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Describe the risk" />
              <Select label="Asset" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })}>
                <option value="">-- Select asset --</option>
                {assets.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </Select>
              <Select label="Threat" value={form.threat_id} onChange={e => setForm({ ...form, threat_id: e.target.value })}>
                <option value="">-- Select threat --</option>
                {threats.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </Select>
              <Select label="Risk Category" value={form.risk_category} onChange={e => setForm({ ...form, risk_category: e.target.value })}>
                <option value="cyber">Cyber</option>
                <option value="operational">Operational</option>
                <option value="compliance">Compliance</option>
                <option value="strategic">Strategic</option>
                <option value="third_party">Third Party</option>
              </Select>
              <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="col-span-2" />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Inherent Risk (Before Controls)</h4>
                <RatingGrid label="Likelihood" value={form.inherent_likelihood} onChange={v => setForm({ ...form, inherent_likelihood: v })} labels={LIKELIHOOD_LABELS} />
                <RatingGrid label="Impact" value={form.inherent_impact} onChange={v => setForm({ ...form, inherent_impact: v })} labels={IMPACT_LABELS} />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-slate-600">Score:</span>
                  <span className="text-lg font-bold" style={{ color: getRiskColor(iScore) }}>{iScore}</span>
                  <Badge color={getRiskLevel(iScore)}>{getRiskLabel(iScore)}</Badge>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Residual Risk (After Controls)</h4>
                <RatingGrid label="Likelihood" value={form.residual_likelihood} onChange={v => setForm({ ...form, residual_likelihood: v })} labels={LIKELIHOOD_LABELS} />
                <RatingGrid label="Impact" value={form.residual_impact} onChange={v => setForm({ ...form, residual_impact: v })} labels={IMPACT_LABELS} />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-slate-600">Score:</span>
                  <span className="text-lg font-bold" style={{ color: getRiskColor(rScore) }}>{rScore}</span>
                  <Badge color={getRiskLevel(rScore)}>{getRiskLabel(rScore)}</Badge>
                </div>
              </div>
            </div>

            {controls.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Applicable Controls</label>
                <div className="flex flex-wrap gap-2">
                  {controls.map(c => (
                    <button key={c._id} type="button"
                      onClick={() => {
                        const ids = form.control_ids.includes(c._id) ? form.control_ids.filter(id => id !== c._id) : [...form.control_ids, c._id];
                        setForm({ ...form, control_ids: ids });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        form.control_ids.includes(c._id) ? 'bg-navy text-white border-navy' : 'bg-white text-slate-700 border-slate-300 hover:border-navy-300'
                      }`}
                    >{c.name}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-4">
              <Select label="Treatment" value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })}>
                <option value="mitigate">Mitigate</option>
                <option value="accept">Accept</option>
                <option value="transfer">Transfer</option>
                <option value="avoid">Avoid</option>
              </Select>
              <Input label="Risk Owner" value={form.risk_owner} onChange={e => setForm({ ...form, risk_owner: e.target.value })} placeholder="e.g., CISO" />
              <Input label="Due Date" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <Textarea label="Treatment Plan" value={form.treatment_plan} onChange={e => setForm({ ...form, treatment_plan: e.target.value })} placeholder="Describe the treatment approach..." />

            <div className="mt-4">
              <Button onClick={addRisk} disabled={!form.title} size="sm">+ Add Risk</Button>
            </div>
          </>
        )}
      </div>

      {risks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Inherent</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Residual</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Treatment</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {risks.map(r => {
                const is = r.inherent_likelihood * r.inherent_impact;
                const rs = r.residual_likelihood * r.residual_impact;
                return (
                  <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{r.risk_id_label}</td>
                    <td className="px-4 py-3 font-medium">{r.title}</td>
                    <td className="px-4 py-3 capitalize">{r.risk_category.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-center"><Badge color={getRiskLevel(is)}>{is}</Badge></td>
                    <td className="px-4 py-3 text-center"><Badge color={getRiskLevel(rs)}>{rs}</Badge></td>
                    <td className="px-4 py-3 capitalize">{r.treatment}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeRisk(r._id)} className="text-slate-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* Rating Grid Selector */
function RatingGrid({ label, value, onChange, labels }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-slate-500 mb-1">{label}: <span className="font-medium text-slate-700">{value} - {labels[value]}</span></div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`w-10 h-8 rounded text-xs font-medium transition-all ${
              v === value
                ? 'bg-navy text-white scale-110 shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

/* Step 6: Review */
function Step6({ registerInfo, assets, threats, controls, risks }) {
  const frameworkLabels = { nist_csf: 'NIST CSF 2.0', iso_27001: 'ISO 27001', sox_itgc: 'SOX ITGC', general: 'General Risk Assessment' };
  const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
  risks.forEach(r => { distribution[getRiskLevel(r.inherent_likelihood * r.inherent_impact)]++; });

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Review & Create</h2>
      <p className="text-slate-500 mb-6">Review your risk register before saving.</p>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Summary</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium">{registerInfo.name}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Framework</dt><dd className="font-medium">{frameworkLabels[registerInfo.framework]}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Assets</dt><dd className="font-medium">{assets.length}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Threats</dt><dd className="font-medium">{threats.length}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Controls</dt><dd className="font-medium">{controls.length}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Risks</dt><dd className="font-medium">{risks.length}</dd></div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Risk Distribution</h3>
          <div className="space-y-3">
            {Object.entries(distribution).map(([level, count]) => (
              <div key={level} className="flex items-center gap-3">
                <Badge color={level} className="w-16 justify-center">{level}</Badge>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    level === 'critical' ? 'bg-red-500' : level === 'high' ? 'bg-orange-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} style={{ width: `${risks.length ? (count / risks.length) * 100 : 0}%` }} />
                </div>
                <span className="text-sm font-medium text-slate-700 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {risks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Heat Map Preview</h3>
          <HeatMap risks={risks.map(r => ({
            ...r,
            inherent_risk_score: r.inherent_likelihood * r.inherent_impact,
            residual_risk_score: r.residual_likelihood * r.residual_impact,
          }))} />
        </div>
      )}
    </div>
  );
}
