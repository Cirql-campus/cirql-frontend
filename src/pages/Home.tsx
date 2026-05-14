import React, { useCallback, useEffect, useState } from 'react';
import { ListingCard } from '../components/ui/ListingCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Grid, BookOpen, Laptop, Bike, Bed, Shirt, Gift, Package, Briefcase } from 'lucide-react';
import { WhyCirql } from './WhyCirql';
import { HowItWorks } from './HowItWorks';
import { Faq } from './Faq';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import './Home.css';

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

export const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, user } = useAuth();
  
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'all';

  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [activeConditions, setActiveConditions] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState({ min: '', max: '', conditions: [] as string[] });
  const [landingSearch, setLandingSearch] = useState(urlSearch);
  const [appliedSearch, setAppliedSearch] = useState(urlSearch);

  useEffect(() => {
    const s = searchParams.get('search');
    const c = searchParams.get('category');
    if (s !== null) {
      setAppliedSearch(s);
      setLandingSearch(s);
    }
    if (c !== null) {
      setActiveCategory(c);
    }
  }, [searchParams]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [dbListings, setDbListings] = useState<Listing[]>([]);
  const [listingPagination, setListingPagination] = useState<CursorPagination>({ hasMore: false, nextCursor: null });
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingMoreListings, setLoadingMoreListings] = useState(false);
  const [marketplaceError, setMarketplaceError] = useState('');

  const mapListing = useCallback((l: ApiListing): Listing => ({
    id: l._id,
    title: l.title,
    price: l.price,
    type: l.type === 'sell' ? 'Sell' : l.type === 'rent' ? 'Rent' : 'Free',
    category: l.category,
    condition: l.condition || 'Good',
    image: l.images?.[0] || '',
    college: l.college || user?.college || 'Campus',
    status: l.status || 'available',
  }), [user?.college]);

  useEffect(() => {
    if (!isLoggedIn || !user?.college) {
      setDbListings([]);
      setListingPagination({ hasMore: false, nextCursor: null });
      setLoadingListings(false);
      setMarketplaceError('');
      return;
    }

    const fetchListings = async () => {
      setLoadingListings(true);
      setMarketplaceError('');
      try {
        const params = new URLSearchParams({ limit: '24', college: user.college });
        if (activeCategory !== 'all') params.append('category', activeCategory);
        if (appliedFilters.min) params.append('minPrice', appliedFilters.min);
        if (appliedFilters.max) params.append('maxPrice', appliedFilters.max);
        if (appliedSearch) params.append('search', appliedSearch);
        appliedFilters.conditions.forEach(c => params.append('condition', c));

        const res = await api.get<{ listings: ApiListing[]; pagination?: CursorPagination }>(`/listings?${params.toString()}`);
        setDbListings((res.listings || []).map(mapListing));
        setListingPagination(res.pagination || { hasMore: false, nextCursor: null });
      } catch (err) {
        setMarketplaceError(getErrorMessage(err, 'Could not load your college listings.'));
      } finally {
        setLoadingListings(false);
      }
    };

    void fetchListings();
  }, [isLoggedIn, mapListing, user?.college, activeCategory, appliedFilters, appliedSearch]);

  const loadMoreListings = async () => {
    if (!user?.college || !listingPagination.hasMore || !listingPagination.nextCursor || loadingMoreListings) return;
    setLoadingMoreListings(true);
    setMarketplaceError('');
    try {
      const params = new URLSearchParams({ limit: '24', college: user.college, cursor: listingPagination.nextCursor });
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (appliedFilters.min) params.append('minPrice', appliedFilters.min);
      if (appliedFilters.max) params.append('maxPrice', appliedFilters.max);
      if (appliedSearch) params.append('search', appliedSearch);
      appliedFilters.conditions.forEach(c => params.append('condition', c));

      const res = await api.get<{ listings: ApiListing[]; pagination?: CursorPagination }>(`/listings?${params.toString()}`);
      setDbListings(prev => [...prev, ...(res.listings || []).map(mapListing)]);
      setListingPagination(res.pagination || { hasMore: false, nextCursor: null });
    } catch (err) {
      setMarketplaceError(getErrorMessage(err, 'Could not load more listings.'));
    } finally {
      setLoadingMoreListings(false);
    }
  };

  const toggleCondition = (c: string) => {
    setActiveConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const handleLandingSearch = () => {
    setAppliedSearch(landingSearch.trim());
    if (landingSearch.trim()) {
      document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goToCampusListings = () => {
    if (isLoggedIn) {
      navigate('/marketplace');
      return;
    }
    navigate('/signup');
  };

  return (
    <>
      {/* ======= ABOUT / LANDING — Exactly 1 viewport, black background ======= */}
      <section className="landing-page">
        <div className="landing-bg-grid"></div>

        <div className="landing-inner">
          {/* Left: Text + Search + Stats */}
          <div className="landing-content">
            <div className="landing-badge">🎓 Verified Students Only &nbsp;·&nbsp; Zero Commission</div>
            <h1 className="landing-title">
              The Campus<br />
              Marketplace<br />
              <span className="landing-accent">Built for You.</span>
            </h1>
            <p className="landing-desc">
              Buy, sell and rent — textbooks, gadgets, cycles, lab kits — directly with
              fellow students. No middlemen. No fees. Just your campus community.
            </p>

            {/* Search bar — lives here in the about/landing page */}
            <div className="landing-search-box">
              <Search size={18} className="landing-search-icon" />
              <input
                type="text"
                placeholder="Search for anything on campus..."
                value={landingSearch}
                onChange={(e) => setLandingSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLandingSearch()}
              />
              <button onClick={handleLandingSearch}>Search</button>
            </div>

            <div className="landing-stats">
              <div className="lstat"><span className="lstat-num">2,400+</span><span className="lstat-lbl">Active Listings</span></div>
              <div className="lstat-div"></div>
              <div className="lstat"><span className="lstat-num">18</span><span className="lstat-lbl">Colleges</span></div>
              <div className="lstat-div"></div>
              <div className="lstat"><span className="lstat-num">₹0</span><span className="lstat-lbl">Commission</span></div>
            </div>
          </div>

          {/* Right: 3 info cards */}
          <div className="landing-cards">
            <div className="lcard">
              <div className="lcard-icon">💸</div>
              <div className="lcard-title">Zero Commission</div>
              <div className="lcard-desc">Keep every rupee. We make no money from your trades — ever.</div>
            </div>
            <div className="lcard lcard-highlight">
              <div className="lcard-icon">🔐</div>
              <div className="lcard-title">Campus Verified</div>
              <div className="lcard-desc">Only students with authenticated college IDs can access listings.</div>
            </div>
            <div className="lcard">
              <div className="lcard-icon">🤝</div>
              <div className="lcard-title">Instant Meetups</div>
              <div className="lcard-desc">No shipping. Meet on campus, exchange directly, &amp; save time.</div>
            </div>
            <div className="landing-ctas">
              <button className="landing-btn-primary" onClick={goToCampusListings}>
                {isLoggedIn ? 'Browse College Listings ->' : 'Get Started Free ->'}
              </button>
              <button className="landing-btn-secondary" onClick={() =>
                isLoggedIn ? navigate('/marketplace') : document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })
              }>
                Browse Listings ↓
              </button>
            </div>
          </div>
        </div>

        <div className="landing-scroll-hint" onClick={() =>
          document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })
        }>
          ↓ scroll to browse listings
        </div>
      </section>

      {/* ======= WHY CIRQL - Directly after About / Landing  ======= */}
      <section style={{ background: '#f8fafc', padding: '40px 0', borderBottom: '1px solid var(--gray-200)' }}>
        <WhyCirql />
      </section>

      {/* ======= MARKETPLACE — Starts after Why Cirql section ======= */}
      <div id="marketplace">
        <div className="trust-bar">
          <div className="trust-inner">
            <div className="trust-item"><div className="trust-icon">🎓</div>Verified Students Only</div>
            <div className="trust-item"><div className="trust-icon">💸</div>Zero Commission</div>
            <div className="trust-item"><div className="trust-icon">📍</div>Campus Hyperlocal</div>
            <div className="trust-item"><div className="trust-icon">💬</div>Instant Chat</div>
            <div className="trust-item"><div className="trust-icon">♻️</div>Eco Friendly</div>
          </div>
        </div>

        <div className="promo-section" style={{ maxWidth: '1320px', margin: '32px auto', padding: '0 20px' }}>
          <div className="promo-grid">
            <div className="promo-main" onClick={() => setActiveCategory('Tech')}>
              <span className="promo-badge-top">Trending</span>
              <div className="promo-label">Campus Tech Hub</div>
              <div className="promo-title">Electronics &amp;<br />Gadgets</div>
              <div className="promo-cta">Browse Now &gt;</div>
            </div>
            <div className="promo-side">
              <div className="promo-sm" onClick={() => setActiveCategory('Academia')}>
                <div className="promo-label">Academic</div>
                <div className="promo-title">Books &amp; Notes</div>
                <div className="promo-cta" style={{ marginTop: '8px' }}>Explore &gt;</div>
              </div>
              <div className="promo-sm" onClick={() => setActiveCategory('Rides')}>
                <div className="promo-label">Campus Rides</div>
                <div className="promo-title">Cycles &amp; Bikes</div>
                <div className="promo-cta" style={{ marginTop: '8px' }}>View All &gt;</div>
              </div>
            </div>
          </div>
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
                    onClick={() => setActiveCategory(cat.value)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <cat.icon size={16} /><span>{cat.label}</span>
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
              {(appliedFilters.min || appliedFilters.max || appliedFilters.conditions.length > 0 || appliedSearch) && (
                <button style={{ width: '100%', marginTop: '8px', padding: '8px', background: 'none', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '12px', fontWeight: 600, color: 'var(--gray-500)', cursor: 'pointer' }}
                  onClick={() => { setPriceMin(''); setPriceMax(''); setActiveConditions([]); setAppliedFilters({ min: '', max: '', conditions: [] }); setAppliedSearch(''); setLandingSearch(''); }}>
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
                Showing <strong>{dbListings.length} results</strong>
                {isLoggedIn && user?.college && <span className="campus-scope-note">from {user.college}</span>}
                {activeCategory !== 'all' && <span style={{ marginLeft: '8px', color: 'var(--accent)', fontWeight: 600 }}>in {activeCategory}</span>}
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="campus-lock-panel">
                <div className="campus-lock-icon">🎓</div>
                <h2>Log in to see your campus marketplace</h2>
                <p>CirQl only shows real listings from your own college after your student account is active. No demo products, no random colleges.</p>
                <div className="campus-lock-actions">
                  <button className="landing-btn-primary" onClick={goToCampusListings}>Create account</button>
                  <button className="landing-btn-secondary light" onClick={() => navigate('/login')}>Log in</button>
                </div>
              </div>
            ) : loadingListings ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-500)' }}>
                Loading listings from {user?.college || 'your college'}...
              </div>
            ) : marketplaceError ? (
              <div className="campus-lock-panel">
                <div className="campus-lock-icon">!</div>
                <h2>Listings could not load</h2>
                <p>{marketplaceError}</p>
              </div>
            ) : dbListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '8px' }}>No real listings found</div>
                <p style={{ fontSize: '14px', color: 'var(--gray-400)' }}>Try clearing filters, or be the first student to post in {user?.college || 'your college'}.</p>
                <button className="apply-btn" style={{ width: 'auto', marginTop: '16px', padding: '10px 24px' }}
                  onClick={() => { setActiveCategory('all'); setAppliedFilters({ min: '', max: '', conditions: [] }); setAppliedSearch(''); setLandingSearch(''); }}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="listings-grid">
                  {dbListings.map(item => <ListingCard key={item.id} {...item} />)}
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

      {/* ======= HOW IT WORKS - Directly after Category / Marketplace  ======= */}
      <section style={{ background: '#ffffff', padding: '20px 0 60px' }}>
        <HowItWorks />
      </section>

      {/* ======= FAQ SECTION  ======= */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid var(--gray-200)', borderBottom: '1px solid var(--gray-200)' }}>
        <Faq />
      </section>
    </>
  );
};

