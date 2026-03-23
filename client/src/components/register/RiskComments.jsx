import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatRelativeDate } from '../../utils/dateFormat';
import Button from '../common/Button';
import toast from 'react-hot-toast';

export default function RiskComments({ registerId, riskId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = () => {
    api.get(`/registers/${registerId}/risks/${riskId}/comments`)
      .then(setComments)
      .catch(() => toast.error('Failed to load comments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComments(); }, [registerId, riskId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.post(`/registers/${registerId}/risks/${riskId}/comments`, { content: newComment.trim() });
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/registers/${registerId}/risks/${riskId}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };


  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        Comments ({comments.length})
      </h4>

      {/* New comment input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !submitting && handleSubmit()}
          placeholder="Add a comment..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-navy focus:border-navy outline-none"
        />
        <Button size="sm" onClick={handleSubmit} disabled={submitting || !newComment.trim()}>
          {submitting ? '...' : 'Post'}
        </Button>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No comments yet</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map(c => (
            <div key={c.id} className="group bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-navy rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{(c.user_name || 'U')[0].toUpperCase()}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-700">{c.user_name || 'User'}</span>
                  <span className="text-xs text-slate-400">{formatRelativeDate(c.created_at)}</span>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-600 ml-8">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
