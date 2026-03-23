import { useState, useEffect } from 'react';
import { SlideOver } from '../common/Modal';
import Button from '../common/Button';
import Input, { Select, Textarea } from '../common/Input';
import Badge from '../common/Badge';
import { api } from '../../utils/api';
import { FRAMEWORK_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function EditRegisterModal({ register, isOpen, onClose, onSaved }) {
  const [activeSection, setActiveSection] = useState('info');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState('general');
  const [saving, setSaving] = useState(false);

  // Entity editing state
  const [assets, setAssets] = useState([]);
  const [threats, setThreats] = useState([]);
  const [controls, setControls] = useState([]);
  const [addForm, setAddForm] = useState(null);

  useEffect(() => {
    if (register && isOpen) {
      setName(register.name || '');
      setDescription(register.description || '');
      setFramework(register.framework || 'general');
      setAssets(register.assets || []);
      setThreats(register.threats || []);
      setControls(register.controls || []);
      setActiveSection('info');
      setAddForm(null);
    }
  }, [register, isOpen]);

  const handleSaveInfo = async () => {
    if (!name.trim()) { toast.error('Register name is required'); return; }
    setSaving(true);
    try {
      await api.put(`/registers/${register.id}`, { name: name.trim(), description: description.trim(), framework });
      toast.success('Register updated');
      onSaved();
    } catch {
      toast.error('Failed to update register');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEntity = async (type, data) => {
    try {
      await api.post(`/registers/${register.id}/${type}s`, data);
      toast.success(`${type} added`);
      setAddForm(null);
      onSaved();
    } catch {
      toast.error(`Failed to add ${type}`);
    }
  };

  const handleUpdateEntity = async (type, id, data) => {
    try {
      await api.put(`/registers/${register.id}/${type}s/${id}`, data);
      toast.success(`${type} updated`);
      onSaved();
    } catch {
      toast.error(`Failed to update ${type}`);
    }
  };

  const handleDeleteEntity = async (type, id) => {
    if (!confirm(`Delete this ${type}?`)) return;
    try {
      await api.delete(`/registers/${register.id}/${type}s/${id}`);
      toast.success(`${type} deleted`);
      onSaved();
    } catch {
      toast.error(`Failed to delete ${type}`);
    }
  };

  const sections = [
    { key: 'info', label: 'Register Info' },
    { key: 'assets', label: `Assets (${assets.length})` },
    { key: 'threats', label: `Threats (${threats.length})` },
    { key: 'controls', label: `Controls (${controls.length})` },
  ];

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Edit Register">
      <div className="space-y-4">
        {/* Section tabs */}
        <div className="flex gap-1 border-b border-slate-200 -mx-6 px-6">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => { setActiveSection(s.key); setAddForm(null); }}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === s.key
                  ? 'border-navy text-navy'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Register Info */}
        {activeSection === 'info' && (
          <div className="space-y-4 animate-fade-in">
            <Input label="Register Name" value={name} onChange={e => setName(e.target.value)} />
            <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Framework</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(FRAMEWORK_LABELS).filter(([k]) => k !== 'custom').map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFramework(key)}
                    className={`px-3 py-2 rounded-lg border-2 text-left text-sm transition-all ${
                      framework === key
                        ? 'border-navy bg-navy-50 text-navy font-medium'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveInfo} disabled={saving || !name.trim()}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}

        {/* Assets */}
        {activeSection === 'assets' && (
          <EntityEditor
            items={assets}
            type="asset"
            fields={[
              { key: 'name', label: 'Name', required: true },
              { key: 'type', label: 'Type', options: ['application', 'infrastructure', 'data'], required: true },
              { key: 'owner', label: 'Owner' },
              { key: 'criticality', label: 'Criticality', options: ['critical', 'high', 'medium', 'low'] },
            ]}
            addForm={addForm}
            onShowAdd={() => setAddForm({})}
            onCancelAdd={() => setAddForm(null)}
            onAdd={data => handleAddEntity('asset', data)}
            onUpdate={(id, data) => handleUpdateEntity('asset', id, data)}
            onDelete={id => handleDeleteEntity('asset', id)}
          />
        )}

        {/* Threats */}
        {activeSection === 'threats' && (
          <EntityEditor
            items={threats}
            type="threat"
            fields={[
              { key: 'name', label: 'Name', required: true },
              { key: 'category', label: 'Category', options: ['cyber', 'operational', 'compliance', 'strategic'], required: true },
              { key: 'source', label: 'Source', options: ['internal', 'external', 'environmental'] },
            ]}
            addForm={addForm}
            onShowAdd={() => setAddForm({})}
            onCancelAdd={() => setAddForm(null)}
            onAdd={data => handleAddEntity('threat', data)}
            onUpdate={(id, data) => handleUpdateEntity('threat', id, data)}
            onDelete={id => handleDeleteEntity('threat', id)}
          />
        )}

        {/* Controls */}
        {activeSection === 'controls' && (
          <EntityEditor
            items={controls}
            type="control"
            fields={[
              { key: 'name', label: 'Name', required: true },
              { key: 'type', label: 'Type', options: ['preventive', 'detective', 'corrective'], required: true },
              { key: 'category', label: 'Category' },
              { key: 'effectiveness', label: 'Effectiveness', options: ['strong', 'moderate', 'weak'] },
              { key: 'owner', label: 'Owner' },
            ]}
            addForm={addForm}
            onShowAdd={() => setAddForm({})}
            onCancelAdd={() => setAddForm(null)}
            onAdd={data => handleAddEntity('control', data)}
            onUpdate={(id, data) => handleUpdateEntity('control', id, data)}
            onDelete={id => handleDeleteEntity('control', id)}
          />
        )}
      </div>
    </SlideOver>
  );
}

function EntityEditor({ items, type, fields, addForm, onShowAdd, onCancelAdd, onAdd, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newData, setNewData] = useState({});

  const startEdit = (item) => { setEditingId(item.id); setEditData({ ...item }); };
  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  useEffect(() => { setNewData({}); }, [addForm]);

  return (
    <div className="animate-fade-in space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">{items.length} {type}{items.length !== 1 ? 's' : ''}</span>
        <Button size="sm" onClick={onShowAdd}>+ Add {type}</Button>
      </div>

      {/* Add form */}
      {addForm !== null && (
        <div className="bg-slate-50 rounded-lg border-2 border-navy/20 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">New {type}</h4>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs text-slate-500 mb-1">{f.label}{f.required ? ' *' : ''}</label>
                {f.options ? (
                  <select
                    value={newData[f.key] || ''}
                    onChange={e => setNewData(d => ({ ...d, [f.key]: e.target.value }))}
                    className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/20"
                  >
                    <option value="">Select...</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    value={newData[f.key] || ''}
                    onChange={e => setNewData(d => ({ ...d, [f.key]: e.target.value }))}
                    className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-navy/20"
                    onKeyDown={e => { if (e.key === 'Enter' && newData.name?.trim()) onAdd(newData); }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={onCancelAdd}>Cancel</Button>
            <Button size="sm" onClick={() => onAdd(newData)} disabled={!newData.name?.trim()}>Add</Button>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className={`rounded-lg border p-3 ${editingId === item.id ? 'border-navy bg-navy-50' : 'border-slate-200 bg-white'}`}>
            {editingId === item.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {fields.map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{f.label}</label>
                      {f.options ? (
                        <select
                          value={editData[f.key] || ''}
                          onChange={e => setEditData(d => ({ ...d, [f.key]: e.target.value }))}
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-navy"
                        >
                          <option value="">-</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          value={editData[f.key] || ''}
                          onChange={e => setEditData(d => ({ ...d, [f.key]: e.target.value }))}
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-navy"
                          onKeyDown={e => { if (e.key === 'Enter') { onUpdate(item.id, editData); cancelEdit(); } if (e.key === 'Escape') cancelEdit(); }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" size="sm" onClick={cancelEdit}>Cancel</Button>
                  <Button size="sm" onClick={() => { onUpdate(item.id, editData); cancelEdit(); }}>Save</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{item.name}</div>
                  <div className="flex gap-2 mt-1">
                    {fields.slice(1).map(f => item[f.key] && (
                      <span key={f.key} className="text-xs text-slate-500 capitalize">{item[f.key]?.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => startEdit(item)} className="text-slate-400 hover:text-navy p-1" title="Edit">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500 p-1" title="Delete">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
