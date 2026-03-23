import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getRiskLevel, getRiskLabel, getRiskBgClass, getRiskTextClass } from '../utils/riskCalculations';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import HeatMap from '../components/heatmap/HeatMap';
import RiskDetailPanel from '../components/register/RiskDetailPanel';
import RiskEditModal from '../components/register/RiskEditModal';
import RegisterCharts from '../components/register/RegisterCharts';
import ScoringGuide from '../components/register/ScoringGuide';
import CloneRegisterModal from '../components/register/CloneRegisterModal';
import CsvImportModal from '../components/register/CsvImportModal';
import EditRegisterModal from '../components/register/EditRegisterModal';
import toast from 'react-hot-toast';
import { FRAMEWORK_LABELS } from '../utils/constants';

export default function RegisterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [register, setRegister] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('risks');
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [editingRisk, setEditingRisk] = useState(null);
  const [sortField, setSortField] = useState('inherent_risk_score');
  const [sortDir, setSortDir] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [exporting, setExporting] = useState(null);
  const [showScoringGuide, setShowScoringGuide] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditRegister, setShowEditRegister] = useState(false);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditField, setInlineEditField] = useState(null);
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [selectedRiskIds, setSelectedRiskIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  const fetchRegister = () => {
    api.get(`/registers/${id}`)
      .then(setRegister)
      .catch(() => { toast.error('Failed to load register'); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRegister(); }, [id]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const blob = await api.getBlob(`/registers/${id}/export/${type}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${register.name.replace(/[^a-zA-Z0-9]/g, '_')}_Risk_Register.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} exported`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleDeleteRisk = async (riskId) => {
    if (!confirm('Delete this risk?')) return;
    try {
      await api.delete(`/registers/${id}/risks/${riskId}`);
      toast.success('Risk deleted');
      fetchRegister();
      setSelectedRisk(null);
    } catch {
      toast.error('Failed to delete risk');
    }
  };

  const handleInlineEdit = async (riskId, field, value) => {
    try {
      const risk = risks.find(r => r.id === riskId);
      if (!risk) return;
      await api.put(`/registers/${id}/risks/${riskId}`, { ...risk, [field]: value });
      fetchRegister();
      toast.success('Updated');
    } catch {
      toast.error('Update failed');
    }
    setInlineEditId(null);
    setInlineEditField(null);
  };

  const startInlineEdit = (riskId, field, currentValue) => {
    setInlineEditId(riskId);
    setInlineEditField(field);
    setInlineEditValue(currentValue || '');
  };

  const toggleRiskSelection = (riskId, e) => {
    e.stopPropagation();
    setSelectedRiskIds(prev => {
      const next = new Set(prev);
      if (next.has(riskId)) next.delete(riskId); else next.add(riskId);
      return next;
    });
  };

  const selectAllRisks = () => {
    if (selectedRiskIds.size === displayRisks.length) {
      setSelectedRiskIds(new Set());
    } else {
      setSelectedRiskIds(new Set(displayRisks.map(r => r.id)));
    }
  };

  const handleBulkUpdate = async (field, value) => {
    if (selectedRiskIds.size === 0) return;
    try {
      await api.put(`/registers/${id}/risks`, {
        risk_ids: [...selectedRiskIds],
        updates: { [field]: value }
      });
      toast.success(`${selectedRiskIds.size} risks updated`);
      setSelectedRiskIds(new Set());
      setBulkAction('');
      fetchRegister();
    } catch {
      toast.error('Bulk update failed');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'Escape') {
        if (selectedRisk) { setSelectedRisk(null); return; }
        if (editingRisk) { setEditingRisk(null); return; }
        if (selectedRiskIds.size > 0) { setSelectedRiskIds(new Set()); return; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedRisk, editingRisk, selectedRiskIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-navy text-white py-4 px-6">
          <div className="max-w-7xl mx-auto h-8 bg-white/20 rounded w-48 animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8"><TableSkeleton /></div>
      </div>
    );
  }

  if (!register) return null;

  const risks = register.risks || [];
  const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
  let totalInherent = 0, totalResidual = 0;
  risks.forEach(r => {
    distribution[getRiskLevel(r.inherent_risk_score)]++;
    totalInherent += r.inherent_risk_score;
    totalResidual += r.residual_risk_score;
  });

  const avgInherent = risks.length ? (totalInherent / risks.length).toFixed(1) : 0;
  const controlsCoverage = register.controls?.length
    ? Math.round((new Set(risks.flatMap(r => (r.controls || []).map(c => c.id))).size / register.controls.length) * 100)
    : 0;

  // Sort and filter risks
  let displayRisks = [...risks];
  if (filterStatus !== 'all') {
    displayRisks = displayRisks.filter(r => r.status === filterStatus);
  }
  displayRisks.sort((a, b) => {
    let av = a[sortField], bv = b[sortField];
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortHeader = ({ field, children }) => (
    <th className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer hover:text-navy select-none" onClick={() => handleSort(field)}>
      <span className="flex items-center gap-1">
        {children}
        {sortField === field && <span className="text-navy">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-white/70 hover:text-white text-sm">← Dashboard</Link>
            <span className="text-white/30">|</span>
            <span className="font-bold">{register.name}</span>
            <Badge color="default">{FRAMEWORK_LABELS[register.framework]}</Badge>
            <button
              onClick={() => setShowEditRegister(true)}
              className="text-white/50 hover:text-white transition-colors"
              title="Edit register"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/70">{user?.name}</span>
            <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-white/70 hover:text-white">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <SummaryCard label="Total Risks" value={risks.length} />
          <SummaryCard label="Critical / High" value={`${distribution.critical} / ${distribution.high}`} color="text-red-600" />
          <SummaryCard label="Medium / Low" value={`${distribution.medium} / ${distribution.low}`} color="text-yellow-600" />
          <SummaryCard label="Avg Score" value={avgInherent} />
          <SummaryCard label="Control Coverage" value={`${controlsCoverage}%`} />
        </div>

        {/* Tab bar + actions */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {['risks', 'heatmap', 'analytics', 'assets', 'threats', 'controls'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-navy text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-navy-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => setShowScoringGuide(true)} title="Scoring Guide">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowCloneModal(true)}>Clone</Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>Import CSV</Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport('pdf')} disabled={!!exporting}>
              {exporting === 'pdf' ? '...' : 'PDF'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport('excel')} disabled={!!exporting}>
              {exporting === 'excel' ? '...' : 'Excel'}
            </Button>
            <Button size="sm" onClick={() => setEditingRisk({})}>+ Add Risk</Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'heatmap' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fade-in">
            <HeatMap risks={risks} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <RegisterCharts risks={risks} />
        )}

        {activeTab === 'risks' && (
          <div className="animate-fade-in">
            {/* Filter */}
            <div className="flex gap-2 mb-4">
              {['all', 'open', 'in_progress', 'closed', 'accepted'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterStatus === s ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Bulk Action Bar */}
            {selectedRiskIds.size > 0 && (
              <div className="bg-navy text-white rounded-xl px-4 py-3 mb-4 flex items-center gap-4 animate-fade-in">
                <span className="text-sm font-medium">{selectedRiskIds.size} selected</span>
                <select
                  value={bulkAction}
                  onChange={e => setBulkAction(e.target.value)}
                  className="text-xs bg-white/10 border border-white/30 rounded px-2 py-1 text-white"
                >
                  <option value="">Bulk action...</option>
                  <optgroup label="Set Status">
                    <option value="status:open">Status: Open</option>
                    <option value="status:in_progress">Status: In Progress</option>
                    <option value="status:closed">Status: Closed</option>
                    <option value="status:accepted">Status: Accepted</option>
                  </optgroup>
                  <optgroup label="Set Treatment">
                    <option value="treatment:mitigate">Treatment: Mitigate</option>
                    <option value="treatment:accept">Treatment: Accept</option>
                    <option value="treatment:transfer">Treatment: Transfer</option>
                    <option value="treatment:avoid">Treatment: Avoid</option>
                  </optgroup>
                </select>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!bulkAction}
                  onClick={() => {
                    const [field, value] = bulkAction.split(':');
                    handleBulkUpdate(field, value);
                  }}
                >Apply</Button>
                <button onClick={() => { setSelectedRiskIds(new Set()); setBulkAction(''); }} className="text-white/70 hover:text-white text-xs ml-auto">
                  Clear selection
                </button>
              </div>
            )}

            {displayRisks.length === 0 ? (
              <EmptyState title="No risks found" description={filterStatus !== 'all' ? 'Try changing the filter' : 'Add risks using the wizard or the Add Risk button'} />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRiskIds.size === displayRisks.length && displayRisks.length > 0}
                          onChange={selectAllRisks}
                          className="rounded border-slate-300"
                        />
                      </th>
                      <SortHeader field="risk_id_label">ID</SortHeader>
                      <SortHeader field="title">Title</SortHeader>
                      <SortHeader field="risk_category">Category</SortHeader>
                      <SortHeader field="inherent_risk_score">Inherent</SortHeader>
                      <SortHeader field="residual_risk_score">Residual</SortHeader>
                      <SortHeader field="treatment">Treatment</SortHeader>
                      <SortHeader field="status">Status</SortHeader>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRisks.map(r => (
                      <tr
                        key={r.id}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedRisk(r)}
                      >
                        <td className="px-3 py-3" onClick={e => toggleRiskSelection(r.id, e)}>
                          <input
                            type="checkbox"
                            checked={selectedRiskIds.has(r.id)}
                            onChange={() => {}}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{r.risk_id_label}</td>
                        <td className="px-4 py-3 font-medium">{r.title}</td>
                        <td className="px-4 py-3 capitalize">{r.risk_category?.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 ${getRiskTextClass(r.inherent_risk_score)}`}>
                            <span className={`w-2 h-2 rounded-full ${getRiskBgClass(r.inherent_risk_score)}`} />
                            {r.inherent_risk_score} ({getRiskLabel(r.inherent_risk_score)})
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 ${getRiskTextClass(r.residual_risk_score)}`}>
                            <span className={`w-2 h-2 rounded-full ${getRiskBgClass(r.residual_risk_score)}`} />
                            {r.residual_risk_score} ({getRiskLabel(r.residual_risk_score)})
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={e => { e.stopPropagation(); startInlineEdit(r.id, 'treatment', r.treatment); }}>
                          {inlineEditId === r.id && inlineEditField === 'treatment' ? (
                            <select
                              autoFocus
                              value={inlineEditValue}
                              onChange={e => setInlineEditValue(e.target.value)}
                              onBlur={() => handleInlineEdit(r.id, 'treatment', inlineEditValue)}
                              onKeyDown={e => { if (e.key === 'Enter') handleInlineEdit(r.id, 'treatment', inlineEditValue); if (e.key === 'Escape') { setInlineEditId(null); } }}
                              className="text-xs border border-navy rounded px-2 py-1 bg-white"
                              onClick={e => e.stopPropagation()}
                            >
                              <option value="mitigate">Mitigate</option>
                              <option value="accept">Accept</option>
                              <option value="transfer">Transfer</option>
                              <option value="avoid">Avoid</option>
                            </select>
                          ) : (
                            <span className="capitalize cursor-pointer hover:text-navy border-b border-dashed border-slate-300">{r.treatment}</span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={e => { e.stopPropagation(); startInlineEdit(r.id, 'status', r.status); }}>
                          {inlineEditId === r.id && inlineEditField === 'status' ? (
                            <select
                              autoFocus
                              value={inlineEditValue}
                              onChange={e => setInlineEditValue(e.target.value)}
                              onBlur={() => handleInlineEdit(r.id, 'status', inlineEditValue)}
                              onKeyDown={e => { if (e.key === 'Enter') handleInlineEdit(r.id, 'status', inlineEditValue); if (e.key === 'Escape') { setInlineEditId(null); } }}
                              className="text-xs border border-navy rounded px-2 py-1 bg-white"
                              onClick={e => e.stopPropagation()}
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="closed">Closed</option>
                              <option value="accepted">Accepted</option>
                            </select>
                          ) : (
                            <span className="cursor-pointer hover:text-navy"><Badge color={r.status}>{r.status?.replace(/_/g, ' ')}</Badge></span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.risk_owner || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assets' && <DataTable items={register.assets} type="asset" registerId={id} onRefresh={fetchRegister} />}
        {activeTab === 'threats' && <DataTable items={register.threats} type="threat" registerId={id} onRefresh={fetchRegister} />}
        {activeTab === 'controls' && <DataTable items={register.controls} type="control" registerId={id} onRefresh={fetchRegister} />}
      </div>

      {/* Risk Detail Slide-over */}
      <RiskDetailPanel
        risk={selectedRisk}
        registerId={id}
        onClose={() => setSelectedRisk(null)}
        onEdit={(r) => { setSelectedRisk(null); setEditingRisk(r); }}
        onDelete={handleDeleteRisk}
        onUpdated={fetchRegister}
      />

      {/* Risk Edit Modal */}
      <RiskEditModal
        risk={editingRisk}
        registerId={id}
        assets={register.assets}
        threats={register.threats}
        controls={register.controls}
        existingRisks={risks}
        onClose={() => setEditingRisk(null)}
        onSaved={() => { setEditingRisk(null); fetchRegister(); }}
      />

      {/* Scoring Guide */}
      <ScoringGuide isOpen={showScoringGuide} onClose={() => setShowScoringGuide(false)} />

      {/* Clone Modal */}
      <CloneRegisterModal
        register={register}
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        onCloned={(newId) => { setShowCloneModal(false); navigate(`/registers/${newId}`); }}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        registerId={id}
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={() => { setShowImportModal(false); fetchRegister(); }}
      />

      {/* Edit Register Modal */}
      <EditRegisterModal
        register={register}
        isOpen={showEditRegister}
        onClose={() => setShowEditRegister(false)}
        onSaved={() => { setShowEditRegister(false); fetchRegister(); }}
      />
    </div>
  );
}

function SummaryCard({ label, value, color = 'text-slate-900' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function DataTable({ items = [], type, registerId, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState({});
  const [saving, setSaving] = useState(false);

  const columns = {
    asset: ['name', 'type', 'owner', 'criticality'],
    threat: ['name', 'category', 'source'],
    control: ['name', 'type', 'category', 'effectiveness', 'owner'],
  };

  const selectOptions = {
    type: { asset: ['application', 'infrastructure', 'data'], control: ['preventive', 'detective', 'corrective'] },
    criticality: ['critical', 'high', 'medium', 'low'],
    effectiveness: ['strong', 'moderate', 'weak'],
    category: { threat: ['cyber', 'operational', 'compliance', 'strategic'], control: null },
    source: ['internal', 'external', 'environmental'],
  };

  const getOptions = (col) => {
    if (col === 'type') return selectOptions.type[type] || null;
    if (col === 'category' && type === 'threat') return selectOptions.category.threat;
    if (['criticality', 'effectiveness', 'source'].includes(col)) return selectOptions[col];
    return null;
  };

  const handleDelete = async (itemId) => {
    if (!confirm(`Delete this ${type}?`)) return;
    try {
      await api.delete(`/registers/${registerId}/${type}s/${itemId}`);
      toast.success(`${type} deleted`);
      onRefresh();
    } catch {
      toast.error(`Failed to delete ${type}`);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/registers/${registerId}/${type}s/${editingId}`, editData);
      toast.success(`${type} updated`);
      setEditingId(null);
      onRefresh();
    } catch {
      toast.error(`Failed to update ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!addData.name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...addData };
      if (type === 'asset' && !payload.type) payload.type = 'application';
      if (type === 'threat' && !payload.category) payload.category = 'cyber';
      if (type === 'control' && !payload.type) payload.type = 'preventive';
      await api.post(`/registers/${registerId}/${type}s`, payload);
      toast.success(`${type} added`);
      setShowAddForm(false);
      setAddData({});
      onRefresh();
    } catch {
      toast.error(`Failed to add ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const renderCell = (item, col, isEditing) => {
    if (isEditing) {
      const options = getOptions(col);
      if (options) {
        return (
          <select value={editData[col] || ''} onChange={e => setEditData(d => ({ ...d, [col]: e.target.value }))}
            className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-navy">
            <option value="">-</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      }
      return (
        <input value={editData[col] || ''} onChange={e => setEditData(d => ({ ...d, [col]: e.target.value }))}
          className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-navy"
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
      );
    }
    if (col === 'effectiveness') return <Badge color={item[col] === 'strong' ? 'low' : item[col] === 'moderate' ? 'medium' : 'high'}>{item[col]}</Badge>;
    if (col === 'criticality') return <Badge color={item[col] === 'critical' ? 'critical' : item[col]}>{item[col]}</Badge>;
    return item[col]?.replace(/_/g, ' ') || '-';
  };

  const cols = columns[type];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => { setShowAddForm(true); setAddData({}); }}>
          + Add {type.charAt(0).toUpperCase() + type.slice(1)}
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl border-2 border-navy/20 p-4 mb-4 animate-fade-in">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">New {type.charAt(0).toUpperCase() + type.slice(1)}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cols.map(col => {
              const options = getOptions(col);
              return (
                <div key={col}>
                  <label className="block text-xs text-slate-500 mb-1 capitalize">{col}</label>
                  {options ? (
                    <select value={addData[col] || ''} onChange={e => setAddData(d => ({ ...d, [col]: e.target.value }))}
                      className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/20">
                      <option value="">Select...</option>
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={addData[col] || ''} onChange={e => setAddData(d => ({ ...d, [col]: e.target.value }))}
                      placeholder={col === 'name' ? `${type} name...` : ''}
                      className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-navy/20"
                      onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAddForm(false); }} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <Button variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button size="sm" disabled={saving} onClick={handleAdd}>{saving ? 'Adding...' : 'Add'}</Button>
          </div>
        </div>
      )}

      {items.length === 0 && !showAddForm ? (
        <EmptyState title={`No ${type}s yet`} description={`Click the button above to add ${type}s.`} />
      ) : items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {cols.map(col => (
                  <th key={col} className="text-left px-4 py-3 font-medium text-slate-600 capitalize">{col}</th>
                ))}
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className={`border-b border-slate-100 ${isEditing ? 'bg-navy-50' : 'hover:bg-slate-50'}`}>
                    {cols.map(col => (
                      <td key={col} className="px-4 py-2 capitalize">{renderCell(item, col, isEditing)}</td>
                    ))}
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button onClick={saveEdit} disabled={saving} className="text-green-600 hover:text-green-700" title="Save">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600" title="Cancel">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(item)} className="text-slate-400 hover:text-navy" title="Edit">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500" title="Delete">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
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
