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
          <h1 className="text-2xl font-bold text-[#1F2A44]">Announcements</h1>
          <p className="text-sm text-[#6B7385]">Official workplace notices, policy updates, and holiday alerts</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnnouncements} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
          {canPost && (
            <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Post Announcement</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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
                item.priority === 'urgent' ? 'border-l-red-500 bg-red-50/20' : 'border-l-[#12A087]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#1F2A44]">{item.title}</h2>
                    {item.priority === 'urgent' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-red-100 text-red-700">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7385] mt-1 flex items-center gap-2">
                    <span>Posted by {item.postedBy?.email}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 text-sm text-[#334155] leading-relaxed whitespace-pre-line border-t border-[#E3E7EE] pt-4">
                {item.body}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Post Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Company Announcement">
        <form onSubmit={handlePost} className="space-y-4">
          {postError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
              {postError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2A44] uppercase mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Eid-ul-Fitr Public Holiday Notice"
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2A44] uppercase mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent Notice</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2A44] uppercase mb-1">
              Message Body <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter announcement details..."
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
