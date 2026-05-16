import React, { useEffect, useState } from 'react';
import { ShieldCheck, Flag, MessageSquareWarning, Users, Search, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../utils/api';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/AppDialog';
import './WorkspacePages.css';

interface AdminDashboard {
  metrics: Record<string, number>;
  queues?: Record<string, unknown[]>;
}

interface Report {
  _id: string;
  reason: string;
  details?: string;
  status: string;
  listing?: { _id: string; title: string };
  message?: { _id: string; text: string; conversation?: string; conversationId?: string };
  conversation?: { _id: string };
  reporter?: { name: string; email: string };
  reportedUser?: { name: string; email: string };
}

interface ModerationListing {
  _id: string;
  title: string;
  price: number;
  moderationStatus: string;
  seller?: { name: string; email: string };
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  college?: string;
  collegeDomain?: string;
  isVerified: boolean;
  role?: string;
  listingCount?: number;
}

interface PendingAdminAction {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  run: () => Promise<void>;
}

export const AdminPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [listingReports, setListingReports] = useState<Report[]>([]);
  const [messageReports, setMessageReports] = useState<Report[]>([]);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [moderationListings, setModerationListings] = useState<ModerationListing[]>([]);
  const [flaggedListings, setFlaggedListings] = useState<ModerationListing[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(null);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price: number) => `Rs.${Number(price || 0).toLocaleString('en-IN')}`;

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const [dash, listings, messages, userReportRes, moderation, flagged, userRes] = await Promise.all([
        api.get<AdminDashboard>('/admin/dashboard'),
        api.get<{ reports: Report[] }>('/admin/listing-reports?status=open'),
        api.get<{ reports: Report[] }>('/admin/message-reports?status=open'),
        api.get<{ reports: Report[] }>('/admin/user-reports?status=open'),
        api.get<{ listings: ModerationListing[] }>('/admin/moderation-listings?status=pending'),
        api.get<{ listings: ModerationListing[] }>('/admin/flagged-listings?limit=10'),
        api.get<{ users: AdminUser[] }>('/admin/users?limit=10'),
      ]);
      setDashboard(dash);
      setListingReports(listings.reports);
      setMessageReports(messages.reports);
      setUserReports(userReportRes.reports);
      setModerationListings(moderation.listings);
      setFlaggedListings(flagged.listings);
      setUsers(userRes.users);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load admin dashboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (endpoint: string, body: unknown) => {
    setBusy(endpoint);
    try {
      await api.patch(endpoint, body);
      await load();
      setPendingAction(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Admin action failed'));
    } finally {
      setBusy('');
    }
  };

  const put = async (endpoint: string) => {
    setBusy(endpoint);
    try {
      await api.put(endpoint, {});
      await load();
      setPendingAction(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Admin action failed'));
    } finally {
      setBusy('');
    }
  };

  const remove = async (endpoint: string) => {
    setBusy(endpoint);
    try {
      await api.delete(endpoint);
      await load();
      setPendingAction(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Admin delete failed'));
    } finally {
      setBusy('');
    }
  };

  const confirmAction = (action: PendingAdminAction) => {
    setPendingAction(action);
  };

  const searchUsers = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const query = userSearch.trim() ? `&search=${encodeURIComponent(userSearch.trim())}` : '';
      const res = await api.get<{ users: AdminUser[] }>(`/admin/users?limit=10${query}`);
      setUsers(res.users);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to search users'));
    }
  };

  const reportCard = (report: Report, type: 'listing' | 'message' | 'user') => (
    <article className="workspace-card" key={report._id}>
      <div className="card-kicker">{report.reason}</div>
      <h2>{report.listing?.title || report.message?.text || report.reportedUser?.name || 'Report'}</h2>
      <p className="muted">Reporter: {report.reporter?.name || 'Student'}</p>
      {report.details && <p>{report.details}</p>}
      <div className="workspace-actions">
        {report.listing?._id && (
          <Button size="sm" variant="outline" onClick={() => navigate(`/item/${report.listing?._id}`)}><Eye size={14} /> View Item</Button>
        )}
        {type === 'message' && (report.conversation?._id || report.message?.conversationId || report.message?.conversation) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/messages/${report.conversation?._id || report.message?.conversationId || report.message?.conversation}`)}
          >
            <Eye size={14} /> View Conversation
          </Button>
        )}
        <Button size="sm" onClick={() => patch(`/admin/${type}-reports/${report._id}/status`, { status: 'reviewed' })} disabled={busy.includes(report._id)}>Reviewed</Button>
        <Button size="sm" variant="outline" onClick={() => patch(`/admin/${type}-reports/${report._id}/status`, { status: 'dismissed' })} disabled={busy.includes(report._id)}>Dismiss</Button>
        {type === 'message' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => confirmAction({
              title: 'Hide this message?',
              description: 'This will hide the reported message after admin review. Use this only when the content is unsafe, abusive, or policy-breaking.',
              confirmLabel: 'Hide Message',
              danger: true,
              run: () => patch(`/admin/message-reports/${report._id}/status`, { status: 'actioned', hiddenByAdmin: true, hiddenReason: 'Hidden after admin review' }),
            })}
          >
            Hide Message
          </Button>
        )}
      </div>
    </article>
  );

  return (
    <div className="workspace-page container">
      <div className="workspace-header">
        <div>
          <h1>Admin Control</h1>
          <p>Moderate listings, reports, users, and unsafe chat content.</p>
        </div>
      </div>
      {error && <div className="auth-error">{error}</div>}
      {loading && <div className="empty-state">Loading admin dashboard...</div>}

      <div className="admin-grid">
        {dashboard && Object.entries(dashboard.metrics).map(([key, value]) => (
          <div className="workspace-card" key={key}>
            <div className="card-kicker"><ShieldCheck size={14} /> {key}</div>
            <h2>{value}</h2>
          </div>
        ))}
      </div>

      <div className="workspace-header" style={{ marginTop: 28 }}>
        <h1>Pending Listings</h1>
      </div>
      <div className="workspace-list">
        {moderationListings.length === 0 ? <div className="empty-state">No pending listings.</div> : moderationListings.map(listing => (
          <article className="workspace-card" key={listing._id}>
            <div className="card-kicker"><Flag size={14} /> {listing.moderationStatus}</div>
            <h2>{listing.title}</h2>
            <p>{formatPrice(listing.price)} / {listing.seller?.name || 'Seller'}</p>
            <div className="workspace-actions">
              <Button size="sm" variant="outline" onClick={() => navigate(`/item/${listing._id}`)}><Eye size={14} /> View</Button>
              <Button size="sm" onClick={() => patch(`/admin/listings/${listing._id}/moderation`, { moderationStatus: 'approved' })}>Approve</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => confirmAction({
                  title: 'Reject this listing?',
                  description: 'This will reject the pending listing and keep it from appearing in the marketplace.',
                  confirmLabel: 'Reject Listing',
                  danger: true,
                  run: () => patch(`/admin/listings/${listing._id}/moderation`, { moderationStatus: 'rejected', moderationReason: 'Rejected by admin review' }),
                })}
              >
                Reject
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="workspace-header" style={{ marginTop: 28 }}>
        <h1>Flagged Listings</h1>
      </div>
      <div className="workspace-list">
        {flaggedListings.length === 0 ? <div className="empty-state">No flagged listings.</div> : flaggedListings.map(listing => (
          <article className="workspace-card" key={listing._id}>
            <div className="card-kicker"><Flag size={14} /> flagged</div>
            <h2>{listing.title}</h2>
            <p>{formatPrice(listing.price)} / {listing.seller?.name || 'Seller'}</p>
            <div className="workspace-actions">
              <Button size="sm" variant="outline" onClick={() => navigate(`/item/${listing._id}`)}><Eye size={14} /> View</Button>
              <Button size="sm" onClick={() => put(`/admin/listings/${listing._id}/unflag`)}>Unflag</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => confirmAction({
                  title: 'Hide this listing?',
                  description: 'This will reject the flagged listing after review and remove it from normal marketplace visibility.',
                  confirmLabel: 'Hide Listing',
                  danger: true,
                  run: () => patch(`/admin/listings/${listing._id}/moderation`, { moderationStatus: 'rejected', moderationReason: 'Rejected after flag review' }),
                })}
              >
                Hide
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-danger"
                onClick={() => confirmAction({
                  title: 'Delete this item?',
                  description: 'This admin action is permanent and cannot be undone.',
                  confirmLabel: 'Delete',
                  danger: true,
                  run: () => remove(`/admin/listings/${listing._id}`),
                })}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="workspace-header" style={{ marginTop: 28 }}>
        <h1>Open Reports</h1>
      </div>
      <div className="admin-grid">
        <section>
          <div className="card-kicker"><Flag size={14} /> Listing reports</div>
          <div className="workspace-list">{listingReports.map(report => reportCard(report, 'listing'))}</div>
        </section>
        <section>
          <div className="card-kicker"><MessageSquareWarning size={14} /> Message reports</div>
          <div className="workspace-list">{messageReports.map(report => reportCard(report, 'message'))}</div>
        </section>
        <section>
          <div className="card-kicker"><Users size={14} /> User reports</div>
          <div className="workspace-list">{userReports.map(report => reportCard(report, 'user'))}</div>
        </section>
      </div>

      <div className="workspace-header" style={{ marginTop: 28 }}>
        <div>
          <h1>Users</h1>
          <p>Search by name, email, or college domain. Ban disables login and hides their listings.</p>
        </div>
        <form className="inline-form" onSubmit={searchUsers}>
          <input value={userSearch} onChange={event => setUserSearch(event.target.value)} placeholder="Search users" />
          <Button type="submit" size="sm"><Search size={14} /> Search</Button>
        </form>
      </div>
      <div className="workspace-list">
        {users.map(user => (
          <article className="workspace-card admin-user-row" key={user._id}>
            <div>
              <div className="card-kicker">{user.role || 'user'} / {user.isVerified ? 'verified' : 'disabled'}</div>
              <h2>{user.name}</h2>
              <p className="muted">{user.email} / {user.college || user.collegeDomain || 'Campus'}</p>
            </div>
            <div className="workspace-actions">
              {user.role === 'admin' ? (
                <Button size="sm" variant="outline" disabled>Admin</Button>
              ) : user.isVerified ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-danger"
                  onClick={() => confirmAction({
                    title: 'Ban this user?',
                    description: 'This disables login for the user and hides their listings. Confirm only after checking reports or suspicious activity.',
                    confirmLabel: 'Ban User',
                    danger: true,
                    run: () => put(`/admin/users/${user._id}/ban`),
                  })}
                >
                  Ban
                </Button>
              ) : (
                <Button size="sm" onClick={() => put(`/admin/users/${user._id}/unban`)}>Unban</Button>
              )}
            </div>
          </article>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.title || 'Confirm admin action'}
        description={pendingAction?.description || 'Please confirm this admin action.'}
        confirmLabel={pendingAction?.confirmLabel || 'Confirm'}
        danger={pendingAction?.danger}
        loading={Boolean(busy)}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => pendingAction?.run()}
      />
    </div>
  );
};

