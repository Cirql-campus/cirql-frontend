import React, { useEffect, useState } from 'react';
import { Settings, Package, LogOut, Edit2, ShieldCheck, ArrowLeft, Bell } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ListingCard } from '../components/ui/ListingCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { SkeletonProfile } from '../components/ui/SkeletonCard';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import {
  getPushNotificationStatus,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from '../utils/pushNotifications';
import type { PushNotificationStatus } from '../utils/pushNotifications';
import './Profile.css';

interface ApiListing {
  _id: string;
  title: string;
  price: number;
  type: 'sell' | 'rent' | 'free' | 'service';
  images?: string[];
  college?: string;
  isActive?: boolean;
  status?: string;
  moderationStatus?: string;
  rentDuration?: string;
}

const mapType = (type: ApiListing['type']) =>
  type === 'sell' ? 'Sell' : type === 'rent' ? 'Rent' : type === 'free' ? 'Free' : 'Service';

const DEFAULT_NOTIFICATION_PREFERENCES = {
  pushEnabled: true,
  messages: true,
  deals: true,
  wanted: true,
  moderation: true,
  messagePreview: false,
};

type ProfileSection = 'listings' | 'edit' | 'settings';

export const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, refreshUser, isAnyAdmin } = useAuth();
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const tabParam = searchParams.get('tab') as ProfileSection;
  const defaultTab = ['listings', 'edit', 'settings'].includes(tabParam) ? tabParam : 'listings';
  const [activeSection, setActiveSection] = useState<ProfileSection>(defaultTab);

  useEffect(() => {
    if (tabParam && ['listings', 'edit', 'settings'].includes(tabParam)) {
      setActiveSection(tabParam);
    }
  }, [tabParam]);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [pushStatus, setPushStatus] = useState<PushNotificationStatus>('not-enabled');
  const [notificationPreferences, setNotificationPreferences] = useState({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(user?.notificationPreferences || {}),
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadListings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ listings: ApiListing[] }>('/listings/mine/me');
      setListings(res.listings);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load your listings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    setProfileForm({ name: user?.name || '', avatar: user?.avatar || '' });
    setNotificationPreferences({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(user?.notificationPreferences || {}),
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getPushNotificationStatus().then(setPushStatus);
  }, [user]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/listings/${id}`);
      setListings(prev => prev.filter(item => item._id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete listing'));
    } finally {
      setDeletingId(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setDeletingId(id);
    setError('');
    try {
      await api.patch(`/listings/${id}/status`, { status });
      await loadListings();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update listing status'));
    } finally {
      setDeletingId(null);
    }
  };

  const renewListing = async (id: string) => {
    setDeletingId(id);
    setError('');
    try {
      await api.post(`/listings/${id}/renew`, {});
      await loadListings();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to renew listing'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileSaving(true);
    setError('');
    setProfileMessage('');

    try {
      await api.put('/users/me', {
        name: profileForm.name.trim(),
        avatar: profileForm.avatar.trim() || undefined,
      });
      await refreshUser();
      setProfileMessage('Profile updated successfully.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update profile'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSettingsSaving(true);
    setError('');
    setSettingsMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirmation do not match.');
      setSettingsSaving(false);
      return;
    }

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSettingsMessage('Password changed successfully. Please log in again if your session expires.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to change password'));
    } finally {
      setSettingsSaving(false);
    }
  };

  const handlePushToggle = async () => {
    setSettingsSaving(true);
    setError('');
    setSettingsMessage('');

    try {
      const result = pushStatus === 'enabled'
        ? await unsubscribeUserFromPush()
        : await subscribeUserToPush();
      setPushStatus(result.status);
      await refreshUser();
      if (result.ok) setSettingsMessage(result.message || 'Notification setting updated.');
      else setError(result.message || 'Failed to update notification setting.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const updateNotificationPreference = async (key: keyof typeof DEFAULT_NOTIFICATION_PREFERENCES, value: boolean) => {
    const nextPreferences = { ...notificationPreferences, [key]: value };
    setNotificationPreferences(nextPreferences);
    setSettingsSaving(true);
    setError('');
    setSettingsMessage('');

    try {
      const res = await api.patch<{ notificationPreferences: typeof DEFAULT_NOTIFICATION_PREFERENCES }>('/users/notification-preferences', {
        [key]: value,
      });
      setNotificationPreferences({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(res.notificationPreferences || {}),
      });
      await refreshUser();
      setSettingsMessage('Notification preferences updated.');
    } catch (err: unknown) {
      setNotificationPreferences({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(user?.notificationPreferences || {}),
      });
      setError(getErrorMessage(err, 'Failed to update notification preferences'));
    } finally {
      setSettingsSaving(false);
    }
  };

  const initials = user?.initials || user?.name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="profile-page container">
      <button 
        className="profile-back-btn"
        onClick={() => navigate('/marketplace')} 
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>
      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-user-card">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile Avatar" className="profile-avatar-large" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="profile-avatar-large">{initials}</div>
            )}
            <h2 className="profile-name">{user?.name || 'Your Profile'}</h2>
            <p className="profile-college">{user?.college || 'Campus member'}</p>
            {isAnyAdmin && (
              <div className="settings-card" style={{ marginTop: 16, textAlign: 'left' }}>
                <div className="settings-card-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3>Admin account</h3>
                  <p>You can moderate listings, reports, users, and unsafe chat content.</p>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              fullWidth
              className="mt-4"
              onClick={() => {
                setError('');
                setProfileMessage('');
                setSearchParams({ tab: 'edit' });
                setActiveSection('edit');
              }}
            >
              <Edit2 size={14} style={{ marginRight: '0.25rem' }} /> Edit Profile
            </Button>
          </div>

          <div className="profile-menu">
            <button
              className={`menu-item ${activeSection === 'listings' ? 'active' : ''}`}
              onClick={() => {
                setError('');
                setSearchParams({ tab: 'listings' });
                setActiveSection('listings');
              }}
            >
              <Package size={18} /> My Listings
            </button>
            {isAnyAdmin && (
              <button
                className="menu-item"
                onClick={() => {
                  setError('');
                  navigate('/admin');
                }}
              >
                <ShieldCheck size={18} /> Admin Control
              </button>
            )}
            <button
              className={`menu-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => {
                setError('');
                setSettingsMessage('');
                setSearchParams({ tab: 'settings' });
                setActiveSection('settings');
              }}
            >
              <Settings size={18} /> Settings
            </button>
            <button className="menu-item text-danger" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </aside>

        <div className="profile-content">
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          {profileMessage && <div className="profile-success">{profileMessage}</div>}
          {settingsMessage && <div className="profile-success">{settingsMessage}</div>}

          {activeSection === 'edit' && (
            <section className="profile-panel">
              <div className="profile-panel-head">
                <h2 className="section-title">Edit Profile</h2>
                <p>Keep your campus profile accurate so other students can recognize you.</p>
              </div>
              <form className="profile-form" onSubmit={handleProfileSubmit}>
                <Input
                  label="Display name"
                  value={profileForm.name}
                  minLength={2}
                  maxLength={60}
                  required
                  onChange={(event) => setProfileForm(prev => ({ ...prev, name: event.target.value }))}
                />
                <Input
                  label="Avatar URL"
                  type="url"
                  value={profileForm.avatar}
                  placeholder="https://example.com/avatar.jpg"
                  onChange={(event) => setProfileForm(prev => ({ ...prev, avatar: event.target.value }))}
                />
                <div className="readonly-grid">
                  <div>
                    <span>Email</span>
                    <strong>{user?.email || 'Not available'}</strong>
                  </div>
                  <div>
                    <span>College</span>
                    <strong>{user?.college || 'Campus member'}</strong>
                  </div>
                </div>
                <div className="profile-form-actions">
                  <Button type="button" variant="outline" onClick={() => setActiveSection('listings')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </form>
            </section>
          )}

          {activeSection === 'settings' && (
            <section className="profile-panel">
              <div className="profile-panel-head">
                <h2 className="section-title">Settings</h2>
                <p>Manage account security and your verified campus identity.</p>
              </div>

              <div className="settings-card">
                <div className="settings-card-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3>Verified student account</h3>
                  <p>{user?.email} is linked to {user?.college || 'your campus'}.</p>
                </div>
              </div>

              <div className="settings-card notification-settings-card">
                <div className="settings-card-icon">
                  <Bell size={20} />
                </div>
                <div className="notification-settings-body">
                  <div className="notification-settings-head">
                    <div>
                      <h3>Desktop alerts</h3>
                      <p>
                        {pushStatus === 'enabled'
                          ? 'This browser is subscribed to CirQl alerts.'
                          : pushStatus === 'blocked'
                            ? 'Notifications are blocked in your browser settings.'
                            : pushStatus === 'unsupported'
                              ? 'This browser does not support web push notifications.'
                              : 'Enable alerts for important marketplace activity.'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={pushStatus === 'enabled' ? 'outline' : 'primary'}
                      disabled={settingsSaving || pushStatus === 'blocked' || pushStatus === 'unsupported'}
                      onClick={handlePushToggle}
                    >
                      {pushStatus === 'enabled' ? 'Disable Alerts' : 'Enable Alerts'}
                    </Button>
                  </div>

                  <div className="notification-toggle-list">
                    {[
                      ['messages', 'Messages'],
                      ['deals', 'Deal updates'],
                      ['wanted', 'Wanted responses'],
                      ['moderation', 'Moderation updates'],
                      ['messagePreview', 'Show message previews'],
                    ].map(([key, label]) => (
                      <label className="notification-toggle" key={key}>
                        <span>{label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(notificationPreferences[key as keyof typeof DEFAULT_NOTIFICATION_PREFERENCES])}
                          disabled={settingsSaving}
                          onChange={(event) => updateNotificationPreference(
                            key as keyof typeof DEFAULT_NOTIFICATION_PREFERENCES,
                            event.target.checked
                          )}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <form className="profile-form" onSubmit={handlePasswordSubmit}>
                <h3 className="profile-form-title">Change password</h3>
                <Input
                  label="Current password"
                  type="password"
                  value={passwordForm.currentPassword}
                  required
                  onChange={(event) => setPasswordForm(prev => ({ ...prev, currentPassword: event.target.value }))}
                />
                <Input
                  label="New password"
                  type="password"
                  value={passwordForm.newPassword}
                  minLength={8}
                  required
                  onChange={(event) => setPasswordForm(prev => ({ ...prev, newPassword: event.target.value }))}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  minLength={8}
                  required
                  onChange={(event) => setPasswordForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                />
                <div className="profile-form-actions">
                  <Button type="submit" disabled={settingsSaving}>
                    {settingsSaving ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </section>
          )}

          {activeSection === 'listings' && (
            <>
              <h2 className="section-title">My Listings</h2>

              {loading ? (
            <SkeletonProfile />
          ) : listings.length > 0 ? (
            <div className="my-listings-grid">
              {listings.map(item => (
                <div key={item._id} className="listing-wrapper">
                  <ListingCard
                    id={item._id}
                    title={item.title}
                    price={item.price}
                    type={mapType(item.type)}
                    image={item.images?.[0] || ''}
                    college={item.college || user?.college || 'Campus'}
                    status={item.status}
                    hideFooter={true}
                    rentDuration={item.rentDuration}
                  />
                  <div className="listing-actions">
                    <Button variant="secondary" size="sm" fullWidth onClick={() => navigate(`/item/${item._id}`)}>
                      View
                    </Button>
                    <Button variant="outline" size="sm" fullWidth onClick={() => navigate(`/listings/${item._id}/edit`)}>
                      Edit
                    </Button>
                  </div>
                  <div className="listing-actions">
                    <Button variant="outline" size="sm" fullWidth onClick={() => updateStatus(item._id, item.status === 'reserved' ? 'available' : 'reserved')} disabled={item.status === 'sold'}>
                      {item.status === 'reserved' ? 'Available' : 'Reserve'}
                    </Button>
                    {item.status !== 'sold' ? (
                      <Button variant="outline" size="sm" fullWidth onClick={() => updateStatus(item._id, 'sold')}>
                        Mark Sold
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" fullWidth onClick={() => updateStatus(item._id, 'available')}>
                        Unsold
                      </Button>
                    )}
                    <Button variant="outline" size="sm" fullWidth onClick={() => renewListing(item._id)} disabled={item.status === 'sold'}>
                      Renew
                    </Button>
                  </div>
                  <div className="listing-actions">
                    <Button
                      variant="outline"
                      className="text-danger"
                      size="sm"
                      fullWidth
                      disabled={deletingId === item._id}
                      onClick={() => handleDelete(item._id)}
                    >
                      {deletingId === item._id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No Active Listings"
              description="You haven't posted any items yet. Create your first campus listing when you're ready."
              actionLabel="Post Your First Item"
              onAction={() => navigate('/create')}
            />
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
