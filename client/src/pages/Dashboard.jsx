import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { CardSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import toast from 'react-hot-toast';
import { FRAMEWORK_LABELS } from '../utils/constants';
import { getRiskLevel, getRiskLabel, getRiskColor } from '../utils/riskCalculations';

export default function Dashboard() {
  const [registers, setRegisters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterFramework, setFilterFramework] = useState('all');
  const [filterRiskLevel, setFilterRiskLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/registers')
      .then(setRegisters)
      .catch(() => toast.error('Failed to load registers'))
      .finally(() => setLoading(false));
  }, []);

  // Global search with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      api.get(`/registers/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && !e.target.closest('input, textarea, select')) {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
      if (e.key === 'Escape') {
        setSearchQuery('');
        setSearchResults(null);
        document.getElementById('global-search')?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/registers/${id}`);
      setRegisters(prev => prev.filter(r => r.id !== id));
      toast.success('Register deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Apply filters
  const frameworks = [...new Set(registers.map(r => r.framework))];
  let filteredRegisters = registers;
  if (filterFramework !== 'all') {
    filteredRegisters = filteredRegisters.filter(r => r.framework === filterFramework);
  }
  if (filterRiskLevel !== 'all') {
    filteredRegisters = filteredRegisters.filter(r => {
      if (filterRiskLevel === 'critical') return r.critical_count > 0;
      if (filterRiskLevel === 'clean') return r.critical_count === 0 && (r.risk_count || 0) > 0;
      if (filterRiskLevel === 'empty') return (r.risk_count || 0) === 0;
      return true;
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold">RiskRegister</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Global Search */}
            <div className="relative">
              <input
                id="global-search"
                type="text"
                placeholder="Search risks... ( / )"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white/10 text-white placeholder-white/50 text-sm px-3 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:border-white/50 focus:bg-white/20 w-48 focus:w-64 transition-all"
              />
              {searchResults && (
                <div className="absolute top-full mt-2 right-0 w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-96 overflow-y-auto">
                  {searching ? (
                    <div className="p-4 text-center text-slate-500 text-sm">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">No results found</div>
                  ) : (
                    <div>
                      <div className="px-3 py-2 bg-slate-50 text-xs text-slate-500 font-medium border-b">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</div>
                      {searchResults.map(r => (
                        <Link
                          key={r.id}
                          to={`/registers/${r.register_id}`}
                          className="block px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                          onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-900">{r.risk_id_label} - {r.title}</span>
                            <span className="text-xs font-bold" style={{ color: getRiskColor(r.inherent_risk_score) }}>
                              {r.inherent_risk_score}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{r.register_name}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <span className="text-sm text-white/70">{user?.name}</span>
            <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-white/70 hover:text-white">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your risk registers</p>
          </div>
          <Link to="/registers/new">
            <Button>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Risk Register
            </Button>
          </Link>
        </div>

        {/* Dashboard Charts */}
        {!loading && registers.length > 0 && <DashboardCharts registers={registers} />}

        {/* Filters */}
        {!loading && registers.length > 0 && (
          <div className="flex gap-3 mb-6 flex-wrap items-center">
            <span className="text-xs text-slate-500 font-medium">Filter:</span>
            <select
              value={filterFramework}
              onChange={e => setFilterFramework(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="all">All Frameworks</option>
              {frameworks.map(f => (
                <option key={f} value={f}>{FRAMEWORK_LABELS[f] || f}</option>
              ))}
            </select>
            <select
              value={filterRiskLevel}
              onChange={e => setFilterRiskLevel(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Has Critical Risks</option>
              <option value="clean">No Critical Risks</option>
              <option value="empty">Empty Registers</option>
            </select>
            {(filterFramework !== 'all' || filterRiskLevel !== 'all') && (
              <button
                onClick={() => { setFilterFramework('all'); setFilterRiskLevel('all'); }}
                className="text-xs text-navy hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : registers.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="No risk registers yet"
            description="Create your first risk register using our guided wizard. Choose a framework template or start from scratch."
            actionLabel="Create Risk Register"
            onAction={() => navigate('/registers/new')}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRegisters.map(reg => (
              <RegisterCard key={reg.id} register={reg} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RegisterCard({ register, onDelete }) {
  const { id, name, framework, risk_count, critical_count, open_count, updated_at, user_role } = register;

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-navy-200 hover:shadow-md transition-all p-6 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link to={`/registers/${id}`} className="text-lg font-semibold text-slate-900 hover:text-navy truncate block">
            {name}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <Badge color="default">{FRAMEWORK_LABELS[framework] || framework}</Badge>
            {user_role && user_role !== 'owner' && (
              <Badge color="medium" className="text-[10px]">Shared ({user_role})</Badge>
            )}
          </div>
        </div>
        {(!user_role || user_role === 'owner') && (
          <button
            onClick={() => onDelete(id, name)}
            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="text-center">
          <div className="text-xl font-bold text-slate-900">{risk_count || 0}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">{critical_count || 0}</div>
          <div className="text-xs text-slate-500">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">{open_count || 0}</div>
          <div className="text-xs text-slate-500">Open</div>
        </div>
      </div>

      {/* Mini risk bar */}
      {risk_count > 0 && (
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex mb-3">
          {critical_count > 0 && <div className="bg-red-500" style={{ width: `${(critical_count / risk_count) * 100}%` }} />}
          <div className="bg-orange-400 flex-1" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Updated {new Date(updated_at).toLocaleDateString()}
        </span>
        <Link to={`/registers/${id}`} className="text-sm text-navy font-medium hover:underline">
          Open →
        </Link>
      </div>
    </div>
  );
}
