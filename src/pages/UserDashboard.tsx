import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonGrid } from '../components/ui/SkeletonCard';
import {
  Bell,
  Handshake,
  MessageCircle,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Eye,
  Heart,
  Star,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/AppDialog';
import './UserDashboard.css';

interface Listing {
  _id: string;
  title: string;
  price: number;
  type: 'sell' | 'rent' | 'free';
  images?: string[];
  college?: string;
  status?: string;
  condition?: string;
  expiresAt?: string;
  views?: number;
  savedBy?: string[];
}

interface Deal {
  _id: string;
  status: string;
  listing?: {
    _id: string;
    title: string;
    price: number;
    images?: string[];
  };
  buyer?: { _id: string; name: string };
  seller?: { _id: string; name: string };
  updatedAt?: string;
}

interface Conversation {
  _id: string;
  listing?: { title?: string; images?: string[] };
  lastMessage?: string;
  unreadCount?: number;
}

interface WantedItem {
  _id: string;
  title: string;
  status: 'open' | 'fulfilled' | 'closed';
  responseCount?: number;
}

const getFirstName = (name = '') => name.trim().split(/\s+/)[0] || 'there';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getExpiryLabel = (expiresAt?: string) => {
  if (!expiresAt) return null;
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return { label: 'Expired', urgent: true };
  if (days <= 3) return { label: `Expires in ${days} day${days === 1 ? '' : 's'}`, urgent: true };
  if (days <= 7) return { label: `Expires in ${days} days`, urgent: false };
  return null;
};

export const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, unreadMessages, unreadAlerts } = useAuth();
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [wantedItems, setWantedItems] = useState<WantedItem[]>([]);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [pendingDeleteListingId, setPendingDeleteListingId] = useState<string | null>(null);
  const [pendingDeleteWantedId, setPendingDeleteWantedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pointSummary, setPointSummary] = useState<{
    totalPoints: number;
    lifetimePoints: number;
    tier: string;
    tierInfo: { name: string; label: string; emoji: string };
    nextTier: { name: string; label: string; minPoints: number } | null;
    pointsToNextTier: number;
    transactions: Array<{ action: string; points: number; note: string; createdAt: string }>;
  } | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const campusParams = new URLSearchParams({ limit: '8' });
        if (user?.college) campusParams.set('college', user.college);
        const [myListingRes, dealRes, conversationRes, wantedRes] = await Promise.all([
          api.get<{ listings: Listing[] }>('/listings/mine/me?page=1&limit=8'),
          api.get<{ deals: Deal[] }>('/deals?page=1&limit=8'),
          api.get<{ conversations: Conversation[] }>('/chat/conversations?page=1&limit=8'),
          api.get<{ wanted: WantedItem[] }>('/wanted/mine?limit=4'),
        ]);

        setMyListings(myListingRes.listings || []);
        setDeals(dealRes.deals || []);
        setConversations(conversationRes.conversations || []);
        setWantedItems(wantedRes.wanted || []);

        api.get<any>('/points/me')
          .then(res => setPointSummary(res))
          .catch(() => {}); // non-critical — silently ignore
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load your dashboard'));
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [user?.college]);

  useEffect(() => {
    import('../utils/socket').then(({ getSocket }) => {
      const socket = getSocket();
      if (!socket) return;

      const handleNewMessage = (payload: { message: { conversationId?: string; conversation?: string; text?: string } }) => {
        const msg = payload.message;
        const convId = msg.conversationId || msg.conversation;
        if (!convId) return;

        setConversations(prev => prev.map(c => {
          if (c._id === convId) {
            return {
              ...c,
              unreadCount: (c.unreadCount || 0) + 1,
              lastMessage: msg.text || c.lastMessage
            };
          }
          return c;
        }));
      };

      socket.on('new_message', handleNewMessage);
      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }).catch(() => {});
  }, []);

  const activeDeals = useMemo(
    () => deals.filter(deal => ['requested', 'accepted'].includes(deal.status)),
    [deals]
  );

  const totalViews = myListings.reduce((sum, l) => sum + (l.views || 0), 0);
  const totalSaved = myListings.reduce((sum, l) => sum + (l.savedBy?.length || 0), 0);

  const stats = [
    { label: 'My listings',     value: myListings.length,              icon: Package },
    { label: 'Active deals',    value: activeDeals.length,             icon: Handshake },
    { label: 'Total views',     value: totalViews,                     icon: Eye },
    { label: 'People watching', value: totalSaved,                     icon: Heart },
    { label: 'Unread messages', value: unreadMessages,                 icon: MessageCircle },
    { label: 'Alerts',          value: unreadAlerts,                   icon: Bell },
    // Points stat — show 0 while loading
    { label: 'CirQl Points',    value: pointSummary?.totalPoints ?? 0, icon: Star },
  ];

  const deleteMyListing = async (id: string) => {
    setDeletingListingId(id);
    setError('');
    try {
      await api.delete(`/listings/${id}`);
      setMyListings(prev => prev.filter(listing => listing._id !== id));
      setPendingDeleteListingId(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete listing'));
    } finally {
      setDeletingListingId(null);
    }
  };

  const handleRenew = async (id: string) => {
    setError('');
    try {
      const res = await api.post<{ listing: Listing }>(`/listings/${id}/renew`, {});
      setMyListings(prev => prev.map(listing => listing._id === id ? res.listing : listing));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to renew listing'));
    }
  };

  const updateWantedStatus = async (id: string, status: WantedItem['status']) => {
    setError('');
    try {
      const res = await api.patch<{ wanted: WantedItem }>(`/wanted/${id}/status`, { status });
      setWantedItems(prev => prev.map(item => item._id === id ? res.wanted : item));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update wanted item'));
    }
  };

  const deleteWanted = async (id: string) => {
    setError('');
    try {
      await api.delete(`/wanted/${id}`);
      setWantedItems(prev => prev.filter(item => item._id !== id));
      setPendingDeleteWantedId(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete wanted item'));
    }
  };

  return (
    <div className="user-dashboard container">
      <section className="dash-hero">
        <div>
          <div className="dash-kicker">
            <ShieldCheck size={16} />
            {user?.isVerified ? 'Verified student' : 'Campus account'}
          </div>
          <h1>{getGreeting()}, {getFirstName(user?.name)}</h1>
          <p>{user?.college || 'Your campus'} marketplace is ready for you.</p>
        </div>
        <div className="dash-hero-actions">
          <Button onClick={() => navigate('/create')}><Plus size={16} strokeWidth={3} /> Post Item</Button>
          <Button variant="outline" onClick={() => navigate('/marketplace')}><Search size={16} /> Marketplace</Button>
        </div>
      </section>

      {error && <div className="auth-error">{error}</div>}

      <section className="dash-stats">
        {stats.map(item => (
          <div className="dash-stat" key={item.label}>
            <item.icon size={18} />
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      {pointSummary && (
        <div className="points-panel">
          <div className="points-panel-header">
            <div className="points-panel-title">
              <span className="points-tier-emoji">
                {pointSummary.tierInfo?.emoji || ''}
              </span>
              <span>{pointSummary.tierInfo?.label || 'New'} Member</span>
              <span className="points-balance">
                {pointSummary.totalPoints} pts
              </span>
            </div>
            {pointSummary.nextTier && (
              <div className="points-progress-wrap">
                <div className="points-progress-bar">
                  <div
                    className="points-progress-fill"
                    style={{
                      width: `${Math.min(100, Math.round(
                        ((pointSummary.lifetimePoints - (pointSummary.tierInfo ? (() => {
                          const tiers = [0, 50, 200, 500, 1000];
                          const idx = ['new','regular','trusted','star_seller','campus_legend']
                            .indexOf(pointSummary.tier);
                          return tiers[idx] || 0;
                        })() : 0)) /
                        (pointSummary.pointsToNextTier + (pointSummary.lifetimePoints - ((() => {
                          const tiers = [0, 50, 200, 500, 1000];
                          const idx = ['new','regular','trusted','star_seller','campus_legend']
                            .indexOf(pointSummary.tier);
                          return tiers[idx] || 0;
                        })())))
                      ) * 100))}%`,
                    }}
                  />
                </div>
                <span className="points-progress-label">
                  {pointSummary.pointsToNextTier} pts to {pointSummary.nextTier.label}
                </span>
              </div>
            )}
          </div>

          {pointSummary.transactions.length > 0 && (
            <div className="points-transactions">
              <div className="points-transactions-title">Recent activity</div>
              {pointSummary.transactions.slice(0, 5).map((t, i) => (
                <div key={i} className="points-transaction-row">
                  <span className="points-transaction-note">{t.note || t.action.replace(/_/g, ' ')}</span>
                  <span className={`points-transaction-amount ${t.points > 0 ? 'earn' : 'spend'}`}>
                    {t.points > 0 ? `+${t.points}` : t.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className="dash-grid">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div>
                <h2>Active deals</h2>
                <p>Requests and campus meetups.</p>
              </div>
              <button onClick={() => navigate('/deals')}>Open</button>
            </div>
            <div className="dash-stack">
              {activeDeals.slice(0, 3).map(deal => (
                <button key={deal._id} onClick={() => navigate('/deals')} className="dash-row">
                  <span>{deal.listing?.title || 'Deal'}</span>
                  <strong>{deal.status}</strong>
                </button>
              ))}
              {activeDeals.length === 0 && <div className="dash-empty small">No active deals.</div>}
            </div>
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div>
                <h2>Messages</h2>
                <p>Latest conversations.</p>
              </div>
              <button onClick={() => navigate('/messages')}>Inbox</button>
            </div>
            <div className="dash-stack">
              {conversations.slice(0, 3).map(conversation => (
                <button key={conversation._id} onClick={() => navigate(`/messages/${conversation._id}`)} className="dash-row">
                  <span>{conversation.listing?.title || conversation.lastMessage || 'Conversation'}</span>
                  <strong>{conversation.unreadCount || 0}</strong>
                </button>
              ))}
              {conversations.length === 0 && <div className="dash-empty small">No messages yet.</div>}
            </div>
          </section>

          <section className="dash-panel dash-panel-wide">
            <div className="dash-panel-head">
              <div>
                <h2>My listings</h2>
                <p>Keep your items fresh and accurate.</p>
              </div>
              <button onClick={() => navigate('/profile')}>Manage</button>
            </div>
            <div className="dash-stack">
              {myListings.slice(0, 4).map(listing => (
                <div key={listing._id} className="dash-row-action">
                  <div onClick={() => navigate(`/item/${listing._id}`)} className="dash-row">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <span>{listing.title}</span>
                      {(listing.views || 0) > 0 && (
                        <span className="listing-views-inline">
                          👁 {listing.views} view{listing.views === 1 ? '' : 's'}
                        </span>
                      )}
                      {(() => {
                        const expiry = getExpiryLabel(listing.expiresAt);
                        return expiry ? (
                          <div className={`expiry-badge ${expiry.urgent ? 'urgent' : 'warning'}`} style={{ alignSelf: 'flex-start' }} onClick={(e) => e.stopPropagation()}>
                            ⏰ {expiry.label}
                            {expiry.urgent && (
                              <button
                                className="renew-inline-btn"
                                onClick={(e) => { e.stopPropagation(); handleRenew(listing._id); }}
                                style={{ marginLeft: '6px' }}
                              >
                                Renew
                              </button>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <strong>{listing.status || 'available'}</strong>
                  </div>
                  <button
                    className="dash-delete-btn"
                    onClick={() => setPendingDeleteListingId(listing._id)}
                    disabled={deletingListingId === listing._id}
                    title="Delete listing"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {myListings.length === 0 && <div className="dash-empty small">You have not posted anything yet.</div>}
            </div>
          </section>

          <section className="dash-panel dash-panel-wide">
            <div className="dash-panel-head">
              <div>
                <h2>My wanted items</h2>
                <p>Things you are looking for on campus.</p>
              </div>
              <button onClick={() => navigate('/wanted/new')}>Post Wanted</button>
            </div>
            <div className="dash-stack">
              {wantedItems.map(item => (
                <div key={item._id} className="dash-wanted-row">
                  <button onClick={() => navigate('/marketplace')} className="dash-row">
                    <span>{item.title}</span>
                    <strong>{item.status}</strong>
                  </button>
                  <button onClick={() => updateWantedStatus(item._id, item.status === 'open' ? 'fulfilled' : 'open')}>
                    {item.status === 'open' ? 'Fulfill' : 'Reopen'}
                  </button>
                  <button className="dash-delete-btn" onClick={() => setPendingDeleteWantedId(item._id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {wantedItems.length === 0 && <div className="dash-empty small">No wanted items yet.</div>}
            </div>
          </section>

          <section className="dash-panel dash-panel-wide safety-panel">
            <div className="dash-panel-head">
              <div>
                <h2>Campus safety</h2>
                <p>Simple rules for every handoff.</p>
              </div>
            </div>
            <ul>
              <li>Meet in public campus places.</li>
              <li>Inspect the item before paying.</li>
              <li>Use Request Deal to unlock trusted reviews.</li>
              <li>Report suspicious listings or users.</li>
            </ul>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteListingId)}
        title="Delete listing?"
        description="This will permanently remove the listing and delete its Cloudinary images."
        confirmLabel="Delete listing"
        danger
        loading={Boolean(deletingListingId)}
        onCancel={() => setPendingDeleteListingId(null)}
        onConfirm={() => pendingDeleteListingId && deleteMyListing(pendingDeleteListingId)}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteWantedId)}
        title="Delete wanted item?"
        description="This request will disappear from your campus wanted items list."
        confirmLabel="Delete wanted item"
        danger
        onCancel={() => setPendingDeleteWantedId(null)}
        onConfirm={() => pendingDeleteWantedId && deleteWanted(pendingDeleteWantedId)}
      />
    </div>
  );
};
