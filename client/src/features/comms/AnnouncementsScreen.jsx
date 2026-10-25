import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { apiRequest } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Megaphone, Plus, AlertCircle, RefreshCw, Calendar, Sparkles } from 'lucide-react';

export function AnnouncementsScreen() {
  const { user } = useAuth();
  const canPost = ['admin', 'hr'].includes(user?.role);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Post Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('/announcements');
      setAnnouncements(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    setPostError(null);
    setSubmitting(true);
    try {
      await apiRequest('/announcements', {
        method: 'POST',
        body: JSON.stringify({ title, body, priority })
      });
      setShowModal(false);
      setTitle('');
      setBody('');
      setPriority('normal');
      fetchAnnouncements();
    } catch (err) {
      setPostError(err.message || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Announcements</h1>
          <p className="text-sm text-[var(--text-muted)]">Official workplace notices, policy updates, and holiday alerts</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchAnnouncements} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
          {canPost && (
            <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Post announcement</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : announcements.length === 0 ? (
        <Card className="p-10">
          <EmptyState
            title="No announcements posted yet"
            description="Company-wide updates and memos will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <Card
              key={item._id}
              className={`p-6 border-l-4 ${
                item.priority === 'urgent'
                  ? 'border-l-red-500 bg-red-50/20 dark:bg-red-950/10'
                  : 'border-l-[var(--primary)]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-[var(--text)]">{item.title}</h2>
                    {item.priority === 'urgent' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-2">
                    <span>Posted by {item.postedBy?.email}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 text-sm text-[var(--text)] leading-relaxed whitespace-pre-line border-t border-[var(--border)] pt-4">
                {item.body}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Post Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New company announcement">
        <form onSubmit={handlePost} className="space-y-4">
          {postError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded text-red-600 dark:text-red-300 text-xs">
              {postError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Eid-ul-Fitr public holiday notice"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent notice</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Message body <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter announcement details..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish announcement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
