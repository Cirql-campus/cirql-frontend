import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Handshake,
  MessageCircle,
  Package,
  PlusCircle,
  Search,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/AppDialog';
import { ListingCard } from '../components/ui/ListingCard';
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

interface NotificationItem {
  _id: string;
  type: string;
  text: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

interface WantedItem {
  _id: string;
  title: string;
  status: 'open' | 'fulfilled' | 'closed';
  responseCount?: number;
}

const mapType = (type: Listing['type']) =>
  type === 'sell' ? 'Sell' : type === 'rent' ? 'Rent' : 'Free';

const getFirstName = (name = '') => name.trim().split(/\s+/)[0] || 'there';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, unreadMessages, unreadAlerts } = useAuth();
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [wantedItems, setWantedItems] = useState<WantedItem[]>([]);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [pendingDeleteListingId, setPendingDeleteListingId] = useState<string | null>(null);
  const [pendingDeleteWantedId, setPendingDeleteWantedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const campusParams = new URLSearchParams({ limit: '8' });
        if (user?.college) campusParams.set('college', user.college);
        const [myListingRes, dealRes, conversationRes, notificationRes, wantedRes] = await Promise.all([
          api.get<{ listings: Listing[] }>('/listings/mine/me?page=1&limit=8'),
          api.get<{ deals: Deal[] }>('/deals?page=1&limit=8'),
          api.get<{ conversations: Conversation[] }>('/chat/conversations?page=1&limit=8'),
          api.get<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications?limit=5'),
          api.get<{ wanted: WantedItem[] }>('/wanted/mine?limit=4'),
        ]);

        setMyListings(myListingRes.listings || []);
        setDeals(dealRes.deals || []);
        setConversations(conversationRes.conversations || []);
        setNotifications(notificationRes.notifications || []);
        setWantedItems(wantedRes.wanted || []);
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

  const completedDeals = useMemo(
    () => deals.filter(deal => deal.status === 'completed'),
    [deals]
  );

  const trustScore = Math.min(100, Math.round(
    (user?.isVerified ? 35 : 0) +
    Math.min(25, (user?.reviewCount || 0) * 5) +
    Math.min(20, Math.max(0, user?.rating || 0) * 4) +
    Math.min(20, completedDeals.length * 5)
  ));

  const stats = [
    { label: 'My listings', value: myListings.length, icon: Package },
    { label: 'Active deals', value: activeDeals.length, icon: Handshake },
    { label: 'Unread messages', value: unreadMessages, icon: MessageCircle },
    { label: 'Alerts', value: unreadAlerts, icon: Bell },
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
          <Button onClick={() => navigate('/create')}><PlusCircle size={16} /> Post item</Button>
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

      {loading ? (
        <div className="dash-empty">Loading your campus dashboard...</div>
      ) : (
        <div className="dash-grid">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div>
                <h2>Trust profile</h2>
                <p>Your marketplace confidence signal.</p>
              </div>
            </div>
            <div className="trust-score">
              <strong>{trustScore}</strong>
              <span>/100</span>
            </div>
            <div className="trust-badges">
              {user?.isVerified && <span><ShieldCheck size={13} /> Verified email</span>}
              {(user?.rating || 0) >= 4 && <span><Star size={13} /> Well rated</span>}
              {completedDeals.length > 0 && <span><CheckCircle2 size={13} /> Completed deals</span>}
            </div>
          </section>

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

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div>
                <h2>Notifications</h2>
                <p>Reports, deals, approvals.</p>
              </div>
              <button onClick={() => navigate('/notifications')}>View</button>
            </div>
            <div className="dash-stack">
              {notifications.slice(0, 3).map(notification => (
                <button key={notification._id} onClick={() => navigate(notification.link || '/notifications')} className="dash-row">
                  <span>{notification.text}</span>
                  <strong>{notification.read ? 'read' : 'new'}</strong>
                </button>
              ))}
              {notifications.length === 0 && <div className="dash-empty small">No alerts yet.</div>}
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
                  <button onClick={() => navigate(`/item/${listing._id}`)} className="dash-row">
                    <span>{listing.title}</span>
                    <strong>{listing.status || 'available'}</strong>
                  </button>
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

          <section className="dash-panel safety-panel">
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
