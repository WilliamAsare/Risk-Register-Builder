import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

const SAMPLE_CSV = `title,risk_category,inherent_likelihood,inherent_impact,residual_likelihood,residual_impact,treatment,risk_owner,status
"Data breach via unpatched servers",cyber,4,5,2,3,mitigate,"IT Security Team",open
"Regulatory non-compliance",compliance,3,4,2,2,mitigate,"Compliance Officer",open
"Third-party vendor failure",third_party,2,3,1,2,transfer,"Procurement",open`;

export default function CsvImportModal({ registerId, isOpen, onClose, onImported }) {
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; continue; }
        if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
        current += char;
      }
      values.push(current.trim());

      const obj = {};
      headers.forEach((h, i) => {
        const val = values[i] || '';
        if (['inherent_likelihood', 'inherent_impact', 'residual_likelihood', 'residual_impact'].includes(h)) {
          obj[h] = Math.min(5, Math.max(1, parseInt(val, 10) || 3));
        } else {
          obj[h] = val;
        }
      });
      return obj;
    });
  };

  const handlePreview = () => {
    setError(null);
    try {
      const risks = parseCSV(csvText);
      if (risks.length === 0) {
        setError('No valid rows found. Check your CSV format.');
        return;
      }
      const missingTitles = risks.filter(r => !r.title);
      if (missingTitles.length > 0) {
        setError(`${missingTitles.length} row(s) missing title field.`);
        return;
      }
      setPreview(risks);
    } catch {
      setError('Failed to parse CSV. Ensure correct format.');
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;
    setImporting(true);
    try {
      const result = await api.post(`/registers/${registerId}/import/csv`, { risks: preview });
      toast.success(`${result.imported} risk(s) imported`);
      onImported();
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const loadSample = () => {
    setCsvText(SAMPLE_CSV);
    setPreview(null);
    setError(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target.result);
      setPreview(null);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Risks from CSV" size="xl">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Paste CSV data or upload a file with risk entries. Required column: <code className="bg-slate-100 px-1 rounded text-xs">title</code>.
          Optional columns: risk_category, inherent_likelihood, inherent_impact, residual_likelihood, residual_impact, treatment, risk_owner, status.
        </p>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={loadSample}>Load Sample</Button>
          <label className="cursor-pointer">
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-700 border border-slate-300 hover:border-navy-300 transition-colors cursor-pointer">
              Upload File
            </span>
          </label>
        </div>

        <div>
          <textarea
            value={csvText}
            onChange={e => { setCsvText(e.target.value); setPreview(null); setError(null); }}
            rows={8}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-navy focus:border-navy outline-none"
            placeholder="Paste CSV content here..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {preview && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Preview ({preview.length} risks)</h4>
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Title</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Category</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-600">IL</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-600">II</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-600">RL</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-600">RI</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Treatment</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className="border-t border-slate-200">
                      <td className="px-3 py-1.5 font-medium">{r.title}</td>
                      <td className="px-3 py-1.5 capitalize">{r.risk_category || 'cyber'}</td>
                      <td className="px-3 py-1.5 text-center">{r.inherent_likelihood || 3}</td>
                      <td className="px-3 py-1.5 text-center">{r.inherent_impact || 3}</td>
                      <td className="px-3 py-1.5 text-center">{r.residual_likelihood || 2}</td>
                      <td className="px-3 py-1.5 text-center">{r.residual_impact || 2}</td>
                      <td className="px-3 py-1.5 capitalize">{r.treatment || 'mitigate'}</td>
                      <td className="px-3 py-1.5">{r.risk_owner || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {!preview ? (
            <Button onClick={handlePreview} disabled={!csvText.trim()}>Preview</Button>
          ) : (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importing...' : `Import ${preview.length} Risk(s)`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
