import React, { useState, useMemo, useEffect } from 'react';
import { ListingCard } from '../components/ui/ListingCard';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Grid, BookOpen, Laptop, Bike, Bed, Shirt, Gift, Package, Briefcase } from 'lucide-react';
import './Dashboard.css';

import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { getPushNotificationStatus, subscribeUserToPush } from '../utils/pushNotifications';
import type { PushNotificationStatus } from '../utils/pushNotifications';

interface Listing {
  id: string;
  title: string;
  price: number;
  type: string;
  category: string;
  condition: string;
  image: string;
  college: string;
  status?: string;
  sellerRating?: number;
  sellerReviewCount?: number;
  sellerName?: string;
  rentDuration?: string;
}

interface ApiListing {
  _id: string;
  title: string;
  price: number;
  type: 'sell' | 'rent' | 'free' | 'service';
  category: string;
  condition?: string;
  images?: string[];
  college?: string;
  status?: string;
  rentDuration?: string;
}

interface WantedItem {
  _id: string;
  title: string;
  description?: string;
  category: string;
  urgency: 'anytime' | 'this_week' | 'urgent';
  minBudget?: number;
  maxBudget?: number;
  responseCount?: number;
  createdAt: string;
  requester?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  status: 'open' | 'fulfilled' | 'closed';
}

interface CursorPagination {
  hasMore: boolean;
  nextCursor?: string | null;
}

const CATEGORIES = [
  { label: 'All Categories', value: 'all', icon: Grid },
  { label: 'Academia', value: 'Academia', icon: BookOpen },
  { label: 'Tech', value: 'Tech', icon: Laptop },
  { label: 'Rides', value: 'Rides', icon: Bike },
  { label: 'Living', value: 'Living', icon: Bed },
  { label: 'Attire', value: 'Attire', icon: Shirt },
  { label: 'Gifts', value: 'Gifts', icon: Gift },
  { label: 'Misc', value: 'Misc', icon: Package },
  { label: 'Services', value: 'Services', icon: Briefcase },
];

const CONDITIONS = ['Brand New', 'Like New', 'Good', 'Fair'];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const activeSearch = searchParams.get('search') || '';
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [activeConditions, setActiveConditions] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState({ min: '', max: '', conditions: [] as string[] });
  const [dbListings, setDbListings] = useState<Listing[]>([]);
  const [wantedItems, setWantedItems] = useState<WantedItem[]>([]);
  const [listingPagination, setListingPagination] = useState<CursorPagination>({ hasMore: false, nextCursor: null });
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingMoreListings, setLoadingMoreListings] = useState(false);
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [pushStatus, setPushStatus] = useState<PushNotificationStatus>('not-enabled');

  const mapListing = (l: any): Listing => ({
    id: l._id,
    title: l.title,
    price: l.price,
    type: l.type === 'sell' ? 'Sell' : l.type === 'rent' ? 'Rent' : l.type === 'free' ? 'Free' : 'Service',
    category: l.category,
    condition: l.condition || 'Good',
    image: l.images?.[0] || '',
    college: l.college || 'Campus',
    status: l.status || 'available',
    sellerRating: l.seller?.rating,
    sellerReviewCount: l.seller?.reviewCount,
    sellerName: l.seller?.name,
    rentDuration: l.rentDuration,
  });

  useEffect(() => {
    if (!isLoggedIn) return;

    getPushNotificationStatus().then(setPushStatus);
  }, [isLoggedIn]);

  const fetchListings = async () => {
    if (!isLoggedIn || !user?.college) return;
    setLoadingListings(true);
    try {
      const params = new URLSearchParams({ limit: '24' });
      params.set('college', user.college);
      const res = await api.get<{ listings: ApiListing[]; pagination?: CursorPagination }>(`/listings?${params.toString()}`);
      setDbListings(res.listings.map(mapListing));
      setListingPagination(res.pagination || { hasMore: false, nextCursor: null });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchWanted = async () => {
    if (!isLoggedIn || !user?.college) return;
    try {
      const params = new URLSearchParams({ limit: '6', status: 'open' });
      const res = await api.get<{ wanted: WantedItem[] }>(`/wanted?${params.toString()}`);
      setWantedItems(res.wanted || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    if (!isLoggedIn || !user?.college) return;
    try {
      const params = new URLSearchParams({ limit: '24' });
      params.set('college', user.college);
      const wantedParams = new URLSearchParams({ limit: '6', status: 'open' });
      
      const [listingsRes, wantedRes] = await Promise.all([
        api.get<{ listings: ApiListing[]; pagination?: CursorPagination }>(`/listings?${params.toString()}`),
        api.get<{ wanted: WantedItem[] }>(`/wanted?${wantedParams.toString()}`)
      ]);
      
      setDbListings(listingsRes.listings.map(mapListing));
      setListingPagination(listingsRes.pagination || { hasMore: false, nextCursor: null });
      setWantedItems(wantedRes.wanted || []);
    } catch (err) {
      console.error(err);
    }
  };

  const { pullDistance, isRefreshing } = usePullToRefresh(handleRefresh);

  useEffect(() => {
    if (!isLoggedIn || !user?.college) {
      setDbListings([]);
      setListingPagination({ hasMore: false, nextCursor: null });
      setLoadingListings(false);
      return;
    }
    fetchListings();
  }, [isLoggedIn, user?.college]);

  const loadMoreListings = async () => {
    if (!isLoggedIn || !user?.college || !listingPagination.hasMore || !listingPagination.nextCursor || loadingMoreListings) return;
    setLoadingMoreListings(true);
    try {
      const params = new URLSearchParams({ limit: '24', cursor: listingPagination.nextCursor });
      params.set('college', user.college);
      const res = await api.get<{ listings: ApiListing[]; pagination?: CursorPagination }>(`/listings?${params.toString()}`);
      setDbListings(prev => [...prev, ...res.listings.map(mapListing)]);
      setListingPagination(res.pagination || { hasMore: false, nextCursor: null });
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Could not load more listings.');
    } finally {
      setLoadingMoreListings(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !user?.college) {
      setWantedItems([]);
      return;
    }
    fetchWanted();
  }, [isLoggedIn, user?.college]);

  const toggleCondition = (c: string) => {
    setActiveConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const filteredListings = useMemo(() => {
    const query = activeSearch.trim().toLowerCase();
    return dbListings.filter(item => {
      if (activeCategory !== 'all' && item.category.toLowerCase() !== activeCategory.toLowerCase()) return false;
      if (query && !`${item.title} ${item.category} ${item.condition} ${item.college}`.toLowerCase().includes(query)) return false;
      if (appliedFilters.min && item.price < Number(appliedFilters.min)) return false;
      if (appliedFilters.max && item.price > Number(appliedFilters.max)) return false;
      if (appliedFilters.conditions.length > 0 && !appliedFilters.conditions.includes(item.condition)) return false;
      return true;
    });
  }, [activeCategory, activeSearch, appliedFilters, dbListings]);

  const getCategoryCount = (cat: string) =>
    cat === 'all' ? dbListings.length : dbListings.filter(i => i.category.toLowerCase() === cat.toLowerCase()).length;

  const scrollToCategory = (cat: string) => {
    const next = new URLSearchParams(searchParams);
    if (cat === 'all') next.delete('category');
    else next.set('category', cat);
    setSearchParams(next);
    setTimeout(() => {
      document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const saveCurrentSearch = async () => {
    setErrorNotice('');
    setSuccessNotice('');
    if (!isLoggedIn) {
      setErrorNotice('Log in to save this search.');
      return;
    }
    try {
      await api.post('/listings/saved-searches', {
        name: activeCategory === 'all' ? 'Marketplace search' : `${activeCategory} search`,
        category: activeCategory === 'all' ? '' : activeCategory.toLowerCase(),
        minPrice: appliedFilters.min || undefined,
        maxPrice: appliedFilters.max || undefined,
        condition: appliedFilters.conditions[0] || '',
        alertsEnabled: true,
      });
      setSuccessNotice('Saved search created. You will get alerts for new matches.');
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Could not save search.');
    }
  };

  const saveListing = async (id: string) => {
    setErrorNotice('');
    setSuccessNotice('');
    if (!isLoggedIn) {
      setErrorNotice('Log in to save listings.');
      return;
    }
    try {
      await api.post(`/listings/${id}/save`, {});
      setSuccessNotice('Added to Cart/Saved!');
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Could not save listing.');
    }
  };

  const respondToWanted = async (wantedId: string) => {
    setErrorNotice('');
    setSuccessNotice('');
    if (!isLoggedIn) {
      setErrorNotice('Log in to respond to wanted items.');
      return;
    }
    try {
      const res = await api.post<{ conversation: { _id: string } }>(`/wanted/${wantedId}/respond`, {});
      navigate(`/messages/${res.conversation._id}`);
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Could not respond to wanted item.');
    }
  };

  const formatBudget = (wanted: WantedItem) => {
    if (wanted.minBudget !== undefined && wanted.maxBudget !== undefined) return `₹${wanted.minBudget} - ₹${wanted.maxBudget}`;
    if (wanted.maxBudget !== undefined) return `Up to ₹${wanted.maxBudget}`;
    if (wanted.minBudget !== undefined) return `From ₹${wanted.minBudget}`;
    return 'Budget open';
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const CATEGORY_ICONS: Record<string, string> = {
    academia: '📚',
    tech: '💻',
    rides: '🚲',
    living: '🏠',
    attire: '👕',
    gifts: '🎁',
    misc: '📦',
  };

  return (
    <>
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="pull-to-refresh-indicator" 
          style={{ 
            transform: `translateY(${Math.min(pullDistance, 80)}px) translateX(-50%)`,
            opacity: Math.min(pullDistance / 60, 1)
          }}
        >
          {isRefreshing ? <span className="refresh-spinner" /> : '↓ Pull to refresh'}
        </div>
      )}
      {/* ======= MARKETPLACE ======= */}
      <div id="marketplace">
        <div className={`dashboard-brand-stage ${!isLoggedIn ? 'dashboard-brand-stage-guest' : ''}`}>
          <div className="dashboard-brand-lockup">
            <Logo size={isLoggedIn ? 34 : 46} lightMode={true} className="dashboard-newsletter-logo" />
            {!isLoggedIn && <div className="dashboard-brand-subtitle">Campus marketplace</div>}
          </div>
        </div>

        <div className="trust-bar">
          <div className="trust-inner">
            <div className="trust-item"><div className="trust-icon">ID</div>Verified Students Only</div>
            <div className="trust-item"><div className="trust-icon">₹0</div>Zero Commission</div>
            <div className="trust-item"><div className="trust-icon">PIN</div>Campus Hyperlocal</div>
            <div className="trust-item"><div className="trust-icon">DM</div>Instant Chat</div>
            <div className="trust-item"><div className="trust-icon">RE</div>Eco Friendly</div>
          </div>
        </div>

        {/* ======= CATEGORY SHOWCASE ======= */}
        <div style={{ maxWidth: '1320px', margin: '0 auto 8px', padding: '32px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '4px' }}>Browse by Category</h2>
              <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Click any category to instantly filter listings</p>
            </div>
            <button
              onClick={() => scrollToCategory('all')}
              style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All
            </button>
          </div>

          <div className="category-showcase-grid">
            {[
              { value: 'Academia', icon: BookOpen, label: 'Academia', sub: 'Books & Notes', color: 'rgba(79, 110, 247, 0.12)', accent: '#4f6ef7' },
              { value: 'Tech', icon: Laptop, label: 'Tech', sub: 'Gadgets & Kits', color: 'rgba(0, 184, 64, 0.12)', accent: '#00b840' },
              { value: 'Rides', icon: Bike, label: 'Rides', sub: 'Cycles & Bikes', color: 'rgba(249, 115, 22, 0.12)', accent: '#f97316' },
              { value: 'Living', icon: Bed, label: 'Living', sub: 'Room & Hostel', color: 'rgba(168, 85, 247, 0.12)', accent: '#a855f7' },
              { value: 'Attire', icon: Shirt, label: 'Attire', sub: 'Clothes & Gear', color: 'rgba(244, 63, 94, 0.12)', accent: '#f43f5e' },
              { value: 'Gifts', icon: Gift, label: 'Gifts', sub: 'Treats & Presents', color: 'rgba(236, 72, 153, 0.12)', accent: '#ec4899' },
              { value: 'Misc', icon: Package, label: 'Misc', sub: 'Everything Else', color: 'rgba(100, 116, 139, 0.12)', accent: '#64748b' },
              { value: 'Services', icon: Briefcase, label: 'Services', sub: 'Gigs & Tutoring', color: 'rgba(217, 70, 239, 0.12)', accent: '#d946ef' },
            ].map(cat => (
              <button
                key={cat.value}
                onClick={() => scrollToCategory(cat.value)}
                className={`cat-showcase-card ${activeCategory === cat.value ? 'active' : ''}`}
                style={{ '--accent-color': cat.accent, '--bg-color': cat.color } as React.CSSProperties}
              >
                <div className="cat-icon-wrap"><cat.icon size={26} strokeWidth={2.5} /></div>
                <div className="cat-info-wrap">
                  <div className="cat-title">{cat.label}</div>
                  <div className="cat-sub">{cat.sub}</div>
                </div>
                <div className="cat-count-badge">{getCategoryCount(cat.value)} items</div>
              </button>
            ))}
          </div>
        </div>

        <div className="wanted-section">
          <div className="wanted-section-head">
            <div>
              <h2>Wanted Items on your campus</h2>
              <p>Can't find something? Post what you need, or respond if you have it.</p>
            </div>
            <button onClick={() => {
              setErrorNotice('');
              setSuccessNotice('');
              if (isLoggedIn) {
                navigate('/wanted/new');
              } else {
                setErrorNotice('Log in to post a wanted item.');
              }
            }}>
              + Wanted Item
            </button>
          </div>

          {!isLoggedIn ? (
            <div className="wanted-empty">Log in to see wanted items from your college.</div>
          ) : wantedItems.length === 0 ? (
            <div className="wanted-empty">No wanted items yet. Be the first to post what you need.</div>
          ) : (
            <div className="wanted-grid">
              {wantedItems.map(wanted => {
                const isOwn = wanted.requester?._id === user?._id;
                const urgencyClass = wanted.urgency === 'urgent' ? 'urgent' : wanted.urgency === 'this_week' ? 'this-week' : 'anytime';
                const urgencyLabel = wanted.urgency === 'urgent' ? '🔥 Urgent' : wanted.urgency === 'this_week' ? '⏰ This week' : 'Anytime';
                const budget = formatBudget(wanted);

                return (
                  <div className={`wanted-card wanted-card--${urgencyClass}`} key={wanted._id}>

                    {/* Top row: title + urgency badge */}
                    <div className="wcard-top">
                      <h3 className="wcard-title">{wanted.title}</h3>
                      <span className={`wcard-urgency wcard-urgency--${urgencyClass}`}>
                        {urgencyLabel}
                      </span>
                    </div>

                    {/* Description */}
                    {wanted.description && (
                      <p className="wcard-desc">{wanted.description}</p>
                    )}

                    {/* Category + budget chips */}
                    <div className="wcard-chips">
                      <span className="wcard-chip wcard-chip--cat">
                        {CATEGORY_ICONS[wanted.category.toLowerCase()] || CATEGORY_ICONS[wanted.category] || '📦'} {wanted.category}
                      </span>
                      {budget && (
                        <span className="wcard-chip wcard-chip--budget">
                          {budget}
                        </span>
                      )}
                    </div>

                    {/* Footer: requester + time + response count */}
                    <div className="wcard-footer">
                      <div className="wcard-requester">
                        <div className="wcard-avatar">
                          {getInitials(wanted.requester?.name)}
                        </div>
                        <span className="wcard-requester-name">
                          {wanted.requester?.name?.split(' ')[0] || 'Student'}
                        </span>
                        <span className="wcard-dot" />
                        <span className="wcard-time">
                          {wanted.createdAt ? timeAgo(wanted.createdAt) : ''}
                        </span>
                      </div>
                      {(wanted.responseCount || 0) > 0 && (
                        <span className="wcard-responses">
                          💬 {wanted.responseCount}
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      className={`wcard-btn ${isOwn ? 'wcard-btn--own' : ''}`}
                      disabled={isOwn}
                      onClick={() => respondToWanted(wanted._id)}
                    >
                      {isOwn ? 'Your request' : 'I have this →'}
                    </button>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="main">
          <div className={`sidebar-overlay ${isMobileSidebarOpen ? 'open' : ''}`} onClick={() => setIsMobileSidebarOpen(false)}></div>
          <aside className={`sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
            <div className="mobile-sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--gray-200)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--gray-900)' }}>Filters</span>
              <button onClick={() => setIsMobileSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '0 8px', color: 'var(--gray-500)' }}>&times;</button>
            </div>
            <div className="filter-box">
              <div className="filter-title">Browse Category</div>
              <div className="filter-list">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    className={`filter-item ${activeCategory === cat.value ? 'filter-item-active' : ''}`}
                    onClick={() => scrollToCategory(cat.value)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <cat.icon size={16} /><span>{cat.label}</span>
                    </span>
                    <span style={{
                      background: activeCategory === cat.value ? 'var(--accent)' : 'var(--gray-100)',
                      color: activeCategory === cat.value ? '#000' : 'var(--gray-600)',
                      padding: '2px 8px', borderRadius: '30px', fontSize: '11px', fontWeight: 700,
                    }}>
                      {getCategoryCount(cat.value)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-box">
              <div className="filter-title">Price Range</div>
              <div className="price-inputs">
                <input className="price-inp" type="number" placeholder="Min ₹" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                <input className="price-inp" type="number" placeholder="Max ₹" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
              </div>
            </div>

            <div className="filter-box">
              <div className="filter-title">Condition</div>
              <div className="condition-list">
                {CONDITIONS.map(c => (
                  <label key={c} className="cond-item" onClick={() => toggleCondition(c)} style={{ cursor: 'pointer' }}>
                    <div className={`cond-checkbox ${activeConditions.includes(c) ? 'checked' : ''}`}
                      style={{ color: activeConditions.includes(c) ? '#fff' : 'transparent', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✓
                    </div>
                    {c}
                  </label>
                ))}
              </div>
              <button className="apply-btn" onClick={() => setAppliedFilters({ min: priceMin, max: priceMax, conditions: activeConditions })}>
                Apply Filters
              </button>
              {(appliedFilters.min || appliedFilters.max || appliedFilters.conditions.length > 0) && (
                <button style={{ width: '100%', marginTop: '8px', padding: '8px', background: 'none', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '12px', fontWeight: 600, color: 'var(--gray-500)', cursor: 'pointer' }}
                  onClick={() => { setPriceMin(''); setPriceMax(''); setActiveConditions([]); setAppliedFilters({ min: '', max: '', conditions: [] }); }}>
                  Clear Filters
                </button>
              )}
            </div>
          </aside>

          <div>
            <button className="mobile-filter-btn" onClick={() => setIsMobileSidebarOpen(true)}>
              <span style={{ fontSize: '16px' }}>⚙️</span> Show Filters
            </button>
            <div className="listings-header">
              <div className="results-text">
                Showing <strong>{filteredListings.length} results</strong>
                {isLoggedIn && user?.college && <span className="campus-scope-note">from {user.college}</span>}
                {activeCategory !== 'all' && <span style={{ marginLeft: '8px', color: 'var(--accent)', fontWeight: 600 }}>in {activeCategory}</span>}
              </div>
              <button className="apply-btn" style={{ width: 'auto', marginTop: 0 }} onClick={saveCurrentSearch}>
                Save Search
              </button>
              {isLoggedIn && (
                <button className="apply-btn enable-alerts-btn" disabled={pushStatus === 'enabled' || pushStatus === 'unsupported' || pushStatus === 'blocked'} onClick={async () => {
                  setErrorNotice('');
                  setSuccessNotice('');
                  const result = await subscribeUserToPush();
                  setPushStatus(result.status);
                  if (result.ok) setSuccessNotice(result.message || 'Push notifications enabled successfully!');
                  else setErrorNotice(result.message || 'Failed to enable push notifications. Check browser permissions.');
                }}>
                  {pushStatus === 'enabled' ? 'Alerts Enabled' : pushStatus === 'blocked' ? 'Alerts Blocked' : 'Enable Alerts'}
                </button>
              )}
            </div>
            {errorNotice && <div className="auth-error" style={{ marginBottom: 12 }}>{errorNotice}</div>}
            {successNotice && <div className="profile-success" style={{ marginBottom: 12, padding: '12px', background: 'rgba(0, 184, 64, 0.1)', color: 'var(--primary)', borderRadius: 'var(--radius)', border: '1px solid rgba(0, 184, 64, 0.2)', fontSize: '14px', fontWeight: 600 }}>{successNotice}</div>}

            {!isLoggedIn ? (
              <div className="campus-lock-panel">
                <div className="campus-lock-icon">ID</div>
                <h2>Log in to see your campus marketplace</h2>
                <p>CirQl only shows real listings from your own college after your student account is active. No demo products, no random colleges.</p>
                <div className="campus-lock-actions">
                  <button className="landing-btn-primary" onClick={() => navigate('/signup')}>Get Started Free</button>
                  <button className="landing-btn-secondary light" onClick={() => navigate('/login')}>Log in</button>
                </div>
              </div>
            ) : loadingListings ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-500)' }}>
                Loading available listings...
              </div>
            ) : filteredListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>Search</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '8px' }}>No listings found</div>
                <p style={{ fontSize: '14px', color: 'var(--gray-400)' }}>Try adjusting or clearing your filters.</p>
                <button className="apply-btn" style={{ width: 'auto', marginTop: '16px', padding: '10px 24px' }}
                  onClick={() => { setSearchParams({ category: 'all' }); setAppliedFilters({ min: '', max: '', conditions: [] }); }}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="listings-grid">
                  {filteredListings.map(item => <ListingCard key={item.id} {...item} onSave={saveListing} />)}
                </div>
                {listingPagination.hasMore && (
                  <button className="apply-btn" style={{ width: 'auto', margin: '24px auto 0', padding: '10px 24px' }} onClick={loadMoreListings} disabled={loadingMoreListings}>
                    {loadingMoreListings ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
