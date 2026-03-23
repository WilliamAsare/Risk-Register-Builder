import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatHistoryDate } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

const ACTION_LABELS = {
  created: { label: 'Created', icon: '+', color: 'text-green-600 bg-green-100' },
  updated: { label: 'Updated', icon: '~', color: 'text-blue-600 bg-blue-100' },
  deleted: { label: 'Deleted', icon: '-', color: 'text-red-600 bg-red-100' },
  comment_added: { label: 'Comment', icon: '#', color: 'text-purple-600 bg-purple-100' },
};

const FIELD_LABELS = {
  title: 'Title',
  status: 'Status',
  treatment: 'Treatment',
  risk_owner: 'Risk Owner',
  inherent_risk_score: 'Inherent Risk Score',
  residual_risk_score: 'Residual Risk Score',
};

export default function RiskHistory({ registerId, riskId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/registers/${registerId}/risks/${riskId}/history`)
      .then(setHistory)
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, [registerId, riskId]);


  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Audit Trail
      </h4>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full" />
              <div className="flex-1">
                <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No history recorded</p>
      ) : (
        <div className="relative max-h-80 overflow-y-auto">
          {/* Timeline line */}
          <div className="absolute left-4 top-3 bottom-3 w-px bg-slate-200" />

          <div className="space-y-3">
            {history.map((entry, i) => {
              const actionInfo = ACTION_LABELS[entry.action] || ACTION_LABELS.updated;
              return (
                <div key={entry.id || i} className="flex gap-3 relative">
                  {/* Timeline dot */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${actionInfo.color}`}>
                    {actionInfo.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-slate-700">{entry.user_name || 'System'}</span>
                      <span className="text-xs text-slate-400">{formatHistoryDate(entry.created_at)}</span>
                    </div>

                    {entry.action === 'created' && (
                      <p className="text-xs text-slate-600 mt-0.5">Created this risk</p>
                    )}

                    {entry.action === 'deleted' && (
                      <p className="text-xs text-slate-600 mt-0.5">Deleted this risk</p>
                    )}

                    {entry.action === 'updated' && entry.field_name && (
                      <div className="text-xs text-slate-600 mt-0.5">
                        Changed <span className="font-medium">{FIELD_LABELS[entry.field_name] || entry.field_name}</span>
                        {entry.old_value && entry.new_value && (
                          <span>
                            {' '}from <span className="line-through text-slate-400">{entry.old_value}</span>
                            {' '}to <span className="font-medium text-navy">{entry.new_value}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {entry.action === 'comment_added' && (
                      <p className="text-xs text-slate-600 mt-0.5 italic">
                        Added comment: "{entry.new_value?.substring(0, 80)}{entry.new_value?.length > 80 ? '...' : ''}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
