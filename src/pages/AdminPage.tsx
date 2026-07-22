import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Flag, 
  MessageSquareWarning, 
  Users, 
  Search, 
  Trash2, 
  Eye, 
  School, 
  History, 
  Megaphone, 
  CheckSquare, 
  XSquare, 
  AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../utils/api';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/AppDialog';
import { useAuth } from '../contexts/AuthContext';
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
  listing?: { _id: string; title: string; college?: string };
  message?: { _id: string; text: string; conversation?: string; conversationId?: string };
  conversation?: { _id: string };
  reporter?: { name: string; email: string; college?: string };
  reportedUser?: { name: string; email: string; college?: string };
}

interface ModerationListing {
  _id: string;
  title: string;
  price: number;
  college?: string;
  moderationStatus: string;
  seller?: { name: string; email: string; college?: string };
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

interface AuditLogEntry {
  _id: string;
  adminId: { _id: string; name: string; email: string } | null;
  adminEmail: string;
  adminCollege: string | null;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
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
  const { user, isSuperAdmin, isCollegeAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'colleges' | 'audit' | 'broadcast'>('dashboard');
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [listingReports, setListingReports] = useState<Report[]>([]);
  const [messageReports, setMessageReports] = useState<Report[]>([]);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [moderationListings, setModerationListings] = useState<ModerationListing[]>([]);
  const [flaggedListings, setFlaggedListings] = useState<ModerationListing[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(null);
  const [loading, setLoading] = useState(true);

  // Colleges Tab States
  const [superColleges, setSuperColleges] = useState<any[]>([]);
  const [collegeAdminsList, setCollegeAdminsList] = useState<any[]>([]);
  const [assigningCollege, setAssigningCollege] = useState<string | null>(null);
  const [assignEmail, setAssignEmail] = useState('');

  // Audit Logs States
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  // Broadcast States
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastLink, setBroadcastLink] = useState('');

  // Bulk Selection States
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);

  const formatPrice = (price: number) => `Rs.${Number(price || 0).toLocaleString('en-IN')}`;

  const loadDashboardData = async () => {
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

  const loadCollegesData = async () => {
    setError('');
    setLoading(true);
    try {
      const [statsRes, adminsRes] = await Promise.all([
        api.get<{ colleges: any[] }>('/admin/super-stats'),
        api.get<{ admins: any[] }>('/admin/college-admins'),
      ]);
      setSuperColleges(statsRes.colleges);
      setCollegeAdminsList(adminsRes.admins);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load colleges data'));
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async (p = 1) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get<{ logs: AuditLogEntry[]; pagination: { total: number; totalPages: number } }>(`/admin/audit-log?page=${p}&limit=20`);
      setAuditLogs(res.logs);
      setAuditTotal(res.pagination.total);
      setAuditPage(p);
      setAuditTotalPages(res.pagination.totalPages || 1);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load audit logs'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    } else if (activeTab === 'colleges') {
      loadCollegesData();
    } else if (activeTab === 'audit') {
      loadAuditLogs(1);
    } else {
      setLoading(false);
    }
    // Clear notifications on tab switch
    setError('');
    setSuccessMsg('');
    setSelectedListingIds([]);
  }, [activeTab]);

  const patch = async (endpoint: string, body: unknown) => {
    setBusy(endpoint);
    try {
      await api.patch(endpoint, body);
      await loadDashboardData();
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
      await loadDashboardData();
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
      await loadDashboardData();
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

  // College Admin Promotion and Dismissal
  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmail || !assigningCollege) return;
    setBusy('assign');
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/admin/college-admins', {
        email: assignEmail.trim(),
        college: assigningCollege
      });
      setSuccessMsg(`Successfully assigned ${assignEmail} as admin of ${assigningCollege}`);
      setAssignEmail('');
      setAssigningCollege(null);
      await loadCollegesData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to promote college admin'));
    } finally {
      setBusy('');
    }
  };

  const handleDismissAdmin = async (adminId: string, college: string, email: string) => {
    setBusy('dismiss');
    setError('');
    setSuccessMsg('');
    try {
      await api.delete(`/admin/college-admins/${adminId}`);
      setSuccessMsg(`Successfully dismissed admin of ${college}`);
      setPendingAction(null);
      await loadCollegesData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to dismiss college admin'));
    } finally {
      setBusy('');
    }
  };

  // Broadcast Notification
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setBusy('broadcast');
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/admin/notify-college', {
        text: broadcastText.trim(),
        link: broadcastLink.trim() || undefined
      });
      setSuccessMsg('Broadcast notification sent successfully!');
      setBroadcastText('');
      setBroadcastLink('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send broadcast'));
    } finally {
      setBusy('');
    }
  };

  // Bulk Actions
  const toggleSelectListing = (id: string) => {
    setSelectedListingIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedListingIds.length === 0) return;
    setBusy('bulk');
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/admin/listings/bulk-action', {
        ids: selectedListingIds,
        action
      });
      setSuccessMsg(`Successfully performed bulk ${action} on ${selectedListingIds.length} listings`);
      setSelectedListingIds([]);
      await loadDashboardData();
    } catch (err) {
      setError(getErrorMessage(err, `Failed to bulk ${action} listings`));
    } finally {
      setBusy('');
    }
  };

  const reportCard = (report: Report, type: 'listing' | 'message' | 'user') => (
    <article className="workspace-card" key={report._id}>
      <div className="card-kicker">{report.reason}</div>
      <h2>{report.listing?.title || report.message?.text || report.reportedUser?.name || 'Report'}</h2>
      <p className="muted">
        Reporter: {report.reporter?.name || 'Student'} ({report.reporter?.college || 'Campus'})
      </p>
      {report.listing?.college && <p className="muted">College Scope: {report.listing.college}</p>}
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
      {/* Scope Banner for College Admin */}
      {isCollegeAdmin && (
        <div className="admin-scope-banner">
          🏫 You are managing <strong>{user?.adminCollege}</strong> — you can only see and act on listings and users from this college.
        </div>
      )}

      <div className="workspace-header">
        <div>
          <h1>Admin Control Panel</h1>
          <p>Manage and moderate CirQl listings, reports, user status, and college scope settings.</p>
        </div>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {successMsg && (
        <div style={{ color: '#2e7d32', background: '#e8f5e9', border: '1px solid #a5d6a7', padding: '12px 16px', borderRadius: '8px', marginBottom: 18 }}>
          {successMsg}
        </div>
      )}

      {/* Tabs Menu */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <ShieldCheck size={14} style={{ marginRight: 6, display: 'inline' }} />
          Dashboard
        </button>
        {isSuperAdmin && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'colleges' ? 'active' : ''}`}
              onClick={() => setActiveTab('colleges')}
            >
              <School size={14} style={{ marginRight: 6, display: 'inline' }} />
              Colleges
            </button>
            <button 
              className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <History size={14} style={{ marginRight: 6, display: 'inline' }} />
              Audit Log
            </button>
          </>
        )}
        <button 
          className={`tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
          onClick={() => setActiveTab('broadcast')}
        >
          <Megaphone size={14} style={{ marginRight: 6, display: 'inline' }} />
          Broadcast
        </button>
      </div>

      {loading && <div className="empty-state">Loading admin data...</div>}

      {/* DASHBOARD TAB */}
      {!loading && activeTab === 'dashboard' && (
        <>
          <div className="admin-grid">
            {dashboard && Object.entries(dashboard.metrics).map(([key, value]) => (
              <div className="workspace-card" key={key}>
                <div className="card-kicker" style={{ textTransform: 'capitalize' }}>
                  <ShieldCheck size={14} /> {key.replace(/([A-Z])/g, ' $1')}
                </div>
                <h2>{value}</h2>
              </div>
            ))}
          </div>

          {/* Pending Listings Section */}
          <div className="workspace-header" style={{ marginTop: 32 }}>
            <h1>Pending Listings ({moderationListings.length})</h1>
          </div>
          <div className="workspace-list">
            {moderationListings.length === 0 ? (
              <div className="empty-state">No pending listings.</div>
            ) : (
              moderationListings.map(listing => (
                <article className="workspace-card relative-card" key={listing._id}>
                  <div className="listing-checkbox-wrapper">
                    <input 
                      type="checkbox"
                      className="listing-checkbox"
                      checked={selectedListingIds.includes(listing._id)}
                      onChange={() => toggleSelectListing(listing._id)}
                      title="Select for bulk action"
                    />
                  </div>
                  <div className="card-kicker"><Flag size={14} /> {listing.moderationStatus}</div>
                  <h2>{listing.title}</h2>
                  <p>{formatPrice(listing.price)} / {listing.seller?.name || 'Seller'} ({listing.college || 'Campus'})</p>
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
              ))
            )}
          </div>

          {/* Flagged Listings Section */}
          <div className="workspace-header" style={{ marginTop: 32 }}>
            <h1>Flagged Listings ({flaggedListings.length})</h1>
          </div>
          <div className="workspace-list">
            {flaggedListings.length === 0 ? (
              <div className="empty-state">No flagged listings.</div>
            ) : (
              flaggedListings.map(listing => (
                <article className="workspace-card relative-card" key={listing._id}>
                  <div className="listing-checkbox-wrapper">
                    <input 
                      type="checkbox"
                      className="listing-checkbox"
                      checked={selectedListingIds.includes(listing._id)}
                      onChange={() => toggleSelectListing(listing._id)}
                      title="Select for bulk action"
                    />
                  </div>
                  <div className="card-kicker"><Flag size={14} /> flagged</div>
                  <h2>{listing.title}</h2>
                  <p>{formatPrice(listing.price)} / {listing.seller?.name || 'Seller'} ({listing.college || 'Campus'})</p>
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
              ))
            )}
          </div>

          {/* Floating Bulk Actions Bar */}
          {selectedListingIds.length > 0 && (
            <div className="bulk-bar">
              <span>Selected {selectedListingIds.length} items</span>
              <div className="bulk-actions-btns">
                <Button size="sm" onClick={() => handleBulkAction('approve')}>
                  <CheckSquare size={14} style={{ marginRight: 4 }} /> Approve Bulk
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('reject')}>
                  <XSquare size={14} style={{ marginRight: 4 }} /> Reject Bulk
                </Button>
                <Button size="sm" variant="secondary" className="text-danger" onClick={() => confirmAction({
                  title: `Delete ${selectedListingIds.length} listings?`,
                  description: 'This action is permanent and will remove the selected items from the database.',
                  confirmLabel: 'Delete Bulk',
                  danger: true,
                  run: () => handleBulkAction('delete')
                })}>
                  <Trash2 size={14} style={{ marginRight: 4 }} /> Delete Bulk
                </Button>
              </div>
            </div>
          )}

          {/* Reports Sections */}
          <div className="workspace-header" style={{ marginTop: 32 }}>
            <h1>Open Reports</h1>
          </div>
          <div className="admin-grid">
            <section>
              <div className="card-kicker"><Flag size={14} /> Listing reports ({listingReports.length})</div>
              <div className="workspace-list" style={{ marginTop: 12 }}>
                {listingReports.length === 0 ? <div className="empty-state">No listing reports.</div> : listingReports.map(report => reportCard(report, 'listing'))}
              </div>
            </section>
            <section>
              <div className="card-kicker"><MessageSquareWarning size={14} /> Message reports ({messageReports.length})</div>
              <div className="workspace-list" style={{ marginTop: 12 }}>
                {messageReports.length === 0 ? <div className="empty-state">No message reports.</div> : messageReports.map(report => reportCard(report, 'message'))}
              </div>
            </section>
            <section>
              <div className="card-kicker"><Users size={14} /> User reports ({userReports.length})</div>
              <div className="workspace-list" style={{ marginTop: 12 }}>
                {userReports.length === 0 ? <div className="empty-state">No user reports.</div> : userReports.map(report => reportCard(report, 'user'))}
              </div>
            </section>
          </div>

          {/* Users Moderation Section */}
          <div className="workspace-header" style={{ marginTop: 32 }}>
            <div>
              <h1>Users Moderation</h1>
              <p>Search users. Banning deactivates listings and prevents login.</p>
            </div>
            <form className="inline-form" onSubmit={searchUsers}>
              <input value={userSearch} onChange={event => setUserSearch(event.target.value)} placeholder="Search users" />
              <Button type="submit" size="sm"><Search size={14} /> Search</Button>
            </form>
          </div>
          <div className="workspace-list">
            {users.map(u => (
              <article className="workspace-card admin-user-row" key={u._id}>
                <div>
                  <div className="card-kicker">{u.role || 'user'} / {u.isVerified ? 'verified' : 'disabled'}</div>
                  <h2>{u.name}</h2>
                  <p className="muted">{u.email} / {u.college || u.collegeDomain || 'Campus'}</p>
                </div>
                <div className="workspace-actions">
                  {u.role === 'super_admin' || u.role === 'college_admin' ? (
                    <Button size="sm" variant="outline" disabled>{u.role === 'super_admin' ? 'Super Admin' : 'College Admin'}</Button>
                  ) : u.isVerified ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-danger"
                      onClick={() => confirmAction({
                        title: 'Ban this user?',
                        description: `This disables logins for ${u.email} and flags their active listings as inactive.`,
                        confirmLabel: 'Ban User',
                        danger: true,
                        run: () => put(`/admin/users/${u._id}/ban`),
                      })}
                    >
                      Ban
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => put(`/admin/users/${u._id}/unban`)}>Unban</Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* COLLEGES TAB (Super Admin Only) */}
      {!loading && activeTab === 'colleges' && isSuperAdmin && (
        <>
          <div className="workspace-header">
            <div>
              <h1>College Stats & Overview</h1>
              <p>Overview of active colleges, total users, and listings count.</p>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>College</th>
                  <th>Users</th>
                  <th>Listings</th>
                  <th>Active</th>
                  <th>Flagged</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                {superColleges.map((c, i) => (
                  <tr key={i}>
                    <td><strong>{c.college || 'Unknown Campus'}</strong></td>
                    <td>{c.totalUsers}</td>
                    <td>{c.totalListings}</td>
                    <td>{c.activeListings}</td>
                    <td>{c.flaggedListings}</td>
                    <td>
                      {c.hasAdmin && c.adminEmail ? (
                        <span style={{ color: '#2e7d32', fontWeight: 600 }}>{c.adminEmail}</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="muted">None</span>
                          <span>—</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setAssigningCollege(c.college);
                              setAssignEmail('');
                            }}
                          >
                            Assign
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Inline Admin Assignment Form */}
          {assigningCollege && (
            <div className="workspace-card" style={{ marginBottom: 28, maxWidth: 500 }}>
              <h2>Assign College Admin</h2>
              <p className="muted" style={{ marginBottom: 12 }}>
                Assigning admin for <strong>{assigningCollege}</strong>. The user must already have a CirQl account.
              </p>
              <form onSubmit={handleAssignAdmin} className="admin-form-inline">
                <input 
                  type="email" 
                  value={assignEmail} 
                  onChange={e => setAssignEmail(e.target.value)} 
                  placeholder="admin.email@domain.com"
                  required
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: 8 }}
                />
                <Button type="submit" disabled={busy === 'assign'}>Assign</Button>
                <Button type="button" variant="outline" onClick={() => setAssigningCollege(null)}>Cancel</Button>
              </form>
            </div>
          )}

          {/* College Admins List */}
          <div className="workspace-header" style={{ marginTop: 32 }}>
            <div>
              <h1>Assigned College Admins</h1>
              <p>Listing of users managing individual campus scopes.</p>
            </div>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>College Scope</th>
                  <th>Promoted On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {collegeAdminsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center' }} className="muted">No college admins assigned yet.</td>
                  </tr>
                ) : (
                  collegeAdminsList.map((adminUser, i) => (
                    <tr key={i}>
                      <td>{adminUser.name}</td>
                      <td>{adminUser.email}</td>
                      <td><span className="card-kicker">{adminUser.adminCollege}</span></td>
                      <td>{new Date(adminUser.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-danger"
                          onClick={() => confirmAction({
                            title: 'Dismiss College Admin?',
                            description: `Are you sure you want to dismiss ${adminUser.email} as the admin for ${adminUser.adminCollege}? They will return to standard user permissions.`,
                            confirmLabel: 'Dismiss Admin',
                            danger: true,
                            run: () => handleDismissAdmin(adminUser._id, adminUser.adminCollege, adminUser.email)
                          })}
                        >
                          Dismiss
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* AUDIT LOG TAB (Super Admin Only) */}
      {!loading && activeTab === 'audit' && isSuperAdmin && (
        <>
          <div className="workspace-header">
            <div>
              <h1>Audit Log ({auditTotal} entries)</h1>
              <p>Historical record of admin actions on listings, reports, and roles.</p>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Scope</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center' }} className="muted">No audit logs recorded yet.</td>
                  </tr>
                ) : (
                  auditLogs.map((log, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>
                        <strong>{log.adminEmail}</strong>
                        {log.adminId && <div style={{ fontSize: 11 }} className="muted">ID: {log.adminId._id}</div>}
                      </td>
                      <td>
                        {log.adminCollege ? (
                          <span className="card-kicker">{log.adminCollege}</span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#0d47a1', fontWeight: 600 }}>Super Admin</span>
                        )}
                      </td>
                      <td><span style={{ fontFamily: 'monospace', background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{log.action}</span></td>
                      <td>{log.targetType || 'N/A'}</td>
                      <td>{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination Controls */}
          {auditTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={auditPage === 1}
                onClick={() => loadAuditLogs(auditPage - 1)}
              >
                Previous
              </Button>
              <span style={{ alignSelf: 'center', fontSize: 14 }} className="muted">
                Page {auditPage} of {auditTotalPages}
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={auditPage === auditTotalPages}
                onClick={() => loadAuditLogs(auditPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* BROADCAST TAB */}
      {!loading && activeTab === 'broadcast' && (
        <div className="workspace-card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2>📢 Send Broadcast Notification</h2>
          <p className="muted" style={{ marginBottom: 18 }}>
            Send a push notification and dashboard alert to all standard users in your college scope.
            College admins are limited to <strong>1 broadcast per 24 hours</strong>.
          </p>

          <form onSubmit={handleSendBroadcast}>
            <div className="admin-form-group">
              <label>Message Content (Max 200 characters)</label>
              <textarea 
                value={broadcastText} 
                onChange={e => setBroadcastText(e.target.value)} 
                maxLength={200}
                required
                placeholder="Enter alert text, e.g. Important notice for KIET students..."
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 12,
                  border: '1px solid var(--gray-200)',
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  fontSize: 14,
                }}
              />
              <div style={{ textAlign: 'right', fontSize: 11, marginTop: 4 }} className="muted">
                {200 - broadcastText.length} characters remaining
              </div>
            </div>

            <div className="admin-form-group">
              <label>Action Link (Optional, Max 200 characters)</label>
              <input 
                type="text" 
                value={broadcastLink} 
                onChange={e => setBroadcastLink(e.target.value)} 
                maxLength={200}
                placeholder="e.g. /marketplace or /item/listing-id"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>

            <Button type="submit" disabled={!broadcastText.trim() || busy === 'broadcast'}>
              {busy === 'broadcast' ? 'Sending Broadcast...' : 'Broadcast Notification'}
            </Button>
          </form>
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.title || 'Confirm admin action'}
        description={pendingAction?.description || 'Please confirm this admin action.'}
        confirmLabel={pendingAction?.confirmLabel || 'Confirm'}
        danger={pendingAction?.danger}
        loading={busy === 'dismiss' || busy.length > 0}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => pendingAction?.run()}
      />
    </div>
  );
};
