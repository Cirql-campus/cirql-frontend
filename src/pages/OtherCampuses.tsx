import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Globe, Search } from 'lucide-react';
import { ListingCard } from '../components/ui/ListingCard';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import './OtherCampuses.css';

interface CampusSummary {
  name: string;
  count: number;
}

interface ApiSeller {
  _id: string;
  name?: string;
  rating?: number;
  reviewCount?: number;
  tier?: string;
}

interface ApiListing {
  _id: string;
  title: string;
  price: number;
  type: 'sell' | 'rent' | 'free' | 'service';
  category: string;
  images?: string[];
  college?: string;
  status?: string;
  rentDuration?: string;
  seller?: ApiSeller;
}

interface PagePagination {
  page: number;
  limit: number;
  hasMore: boolean;
}

interface CardListing {
  id: string;
  title: string;
  price: number;
  type: string;
  image: string;
  college: string;
  status: string;
  sellerId?: string;
  sellerName?: string;
  sellerRating?: number;
  sellerReviewCount?: number;
  sellerTier?: string;
  rentDuration?: string;
}

const PAGE_SIZE = 12;

const CATEGORIES = [
  { label: 'All categories', value: 'all' },
  { label: 'Academia', value: 'academia' },
  { label: 'Tech', value: 'tech' },
  { label: 'Rides', value: 'rides' },
  { label: 'Living', value: 'living' },
  { label: 'Attire', value: 'attire' },
  { label: 'Gifts', value: 'gifts' },
  { label: 'Misc', value: 'misc' },
  { label: 'Services', value: 'services' },
];

const SORTS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: low to high', value: 'price_asc' },
  { label: 'Price: high to low', value: 'price_desc' },
];

const TYPE_LABELS: Record<string, string> = {
  sell: 'Sell',
  rent: 'Rent',
  free: 'Free',
  service: 'Service',
};

const toCardListing = (l: ApiListing): CardListing => ({
  id: l._id,
  title: l.title,
  price: l.price,
  type: TYPE_LABELS[l.type] || 'Service',
  image: l.images?.[0] || '',
  college: l.college || 'Another campus',
  status: l.status || 'available',
  sellerId: l.seller?._id,
  sellerName: l.seller?.name,
  sellerRating: l.seller?.rating,
  sellerReviewCount: l.seller?.reviewCount,
  sellerTier: l.seller?.tier,
  rentDuration: l.rentDuration,
});

export const OtherCampuses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCollege = searchParams.get('college') || '';

  const [colleges, setColleges] = useState<CampusSummary[]>([]);
  const [allColleges, setAllColleges] = useState<CampusSummary[]>([]);
  const [campusQuery, setCampusQuery] = useState('');
  const [collegesLoaded, setCollegesLoaded] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');

  const [listings, setListings] = useState<CardListing[]>([]);
  const [pagination, setPagination] = useState<PagePagination>({ page: 1, limit: PAGE_SIZE, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [messagingId, setMessagingId] = useState('');

  // Ignore responses from a previous filter if the user changes filters quickly.
  const requestSeq = useRef(0);

  // ── Campus list (chips) ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    api.get<{ colleges: CampusSummary[]; allColleges?: CampusSummary[] }>('/listings/other-campuses/colleges')
      .then(res => {
        if (cancelled) return;
        setColleges(res.colleges || []);
        setAllColleges(res.allColleges || res.colleges || []);
      })
      .catch(() => { /* chips are optional — the list below still works */ })
      .finally(() => { if (!cancelled) setCollegesLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // ── Debounce the search box ────────────────────────────────────────────────
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const buildQuery = useCallback((page: number) => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
    if (selectedCollege) params.set('college', selectedCollege);
    if (search.length >= 2) params.set('search', search);
    if (category !== 'all') params.set('category', category);
    return params.toString();
  }, [selectedCollege, search, category, sort]);

  // ── First page whenever a filter changes ───────────────────────────────────
  useEffect(() => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError('');
    api.get<{ listings: ApiListing[]; pagination: PagePagination }>(`/listings/other-campuses?${buildQuery(1)}`)
      .then(res => {
        if (seq !== requestSeq.current) return;
        setListings((res.listings || []).map(toCardListing));
        setPagination(res.pagination || { page: 1, limit: PAGE_SIZE, hasMore: false });
      })
      .catch(err => {
        if (seq !== requestSeq.current) return;
        setListings([]);
        setPagination({ page: 1, limit: PAGE_SIZE, hasMore: false });
        setError(getErrorMessage(err, 'Could not load items from other campuses.'));
      })
      .finally(() => {
        if (seq === requestSeq.current) setLoading(false);
      });
  }, [buildQuery]);

  const loadMore = async () => {
    if (loadingMore || !pagination.hasMore) return;
    const seq = requestSeq.current;
    setLoadingMore(true);
    try {
      const res = await api.get<{ listings: ApiListing[]; pagination: PagePagination }>(
        `/listings/other-campuses?${buildQuery(pagination.page + 1)}`
      );
      if (seq !== requestSeq.current) return;
      setListings(prev => {
        const seen = new Set(prev.map(item => item.id));
        return [...prev, ...(res.listings || []).map(toCardListing).filter(item => !seen.has(item.id))];
      });
      setPagination(res.pagination || { ...pagination, hasMore: false });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load more items.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const selectCollege = (name: string) => {
    const next = new URLSearchParams(searchParams);
    if (name) next.set('college', name);
    else next.delete('college');
    setSearchParams(next, { replace: true });
  };

  const messageSeller = async (listingId: string) => {
    const item = listings.find(entry => entry.id === listingId);
    if (!item?.sellerId) {
      navigate(`/item/${listingId}`);
      return;
    }
    setMessagingId(listingId);
    setError('');
    try {
      const res = await api.post<{ conversation: { _id: string } }>('/chat/conversations', {
        listingId,
        sellerId: item.sellerId,
      });
      navigate(`/messages/${res.conversation._id}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not start the chat. Please try again.'));
    } finally {
      setMessagingId('');
    }
  };

  const saveListing = async (listingId: string) => {
    setNotice('');
    setError('');
    try {
      await api.post(`/listings/${listingId}/save`, {});
      setNotice('Saved listing updated.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save this listing.'));
    }
  };

  const totalItems = useMemo(() => colleges.reduce((sum, c) => sum + c.count, 0), [colleges]);
  const hasFilters = Boolean(selectedCollege || search || category !== 'all');

  // "Find a campus": picking a campus from the list (e.g. HIMT, SRM) opens it, even
  // if nobody there has listed anything yet.
  const handleCampusQuery = (value: string) => {
    setCampusQuery(value);
    const match = allColleges.find(c => c.name.toLowerCase() === value.trim().toLowerCase());
    if (match) {
      selectCollege(match.name);
      setCampusQuery('');
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategory('all');
    selectCollege('');
  };

  return (
    <div className="oc-page">
      <header className="oc-hero">
        <div className="oc-hero-icon"><Globe size={26} strokeWidth={2.2} /></div>
        <div>
          <h1>Other campuses</h1>
          <p>
            See what students at other colleges are selling, renting or giving away.
            Open an item for details, or message the seller straight from the card.
          </p>
          {user?.college && <span className="oc-hero-note">Your campus ({user.college}) is on the main Marketplace.</span>}
        </div>
      </header>

      <div className="oc-chips" role="tablist" aria-label="Filter by campus">
        <button
          type="button"
          role="tab"
          aria-selected={!selectedCollege}
          className={`oc-chip ${!selectedCollege ? 'active' : ''}`}
          onClick={() => selectCollege('')}
        >
          All campuses{collegesLoaded && totalItems > 0 ? <span className="oc-chip-count">{totalItems}</span> : null}
        </button>
        {colleges.map(college => (
          <button
            key={college.name}
            type="button"
            role="tab"
            aria-selected={selectedCollege === college.name}
            className={`oc-chip ${selectedCollege === college.name ? 'active' : ''}`}
            onClick={() => selectCollege(college.name)}
          >
            {college.name}<span className="oc-chip-count">{college.count}</span>
          </button>
        ))}
        {/* A campus opened from a shared link that currently has no chip */}
        {selectedCollege && !colleges.some(c => c.name === selectedCollege) && (
          <button type="button" role="tab" aria-selected className="oc-chip active" onClick={() => selectCollege('')}>
            {selectedCollege} ✕
          </button>
        )}
      </div>

      {allColleges.length > 0 && (
        <div className="oc-campus-find">
          <label htmlFor="oc-campus-input">Find a campus</label>
          <input
            id="oc-campus-input"
            list="oc-campus-list"
            type="text"
            autoComplete="off"
            placeholder={`Type a college name — ${allColleges.length} campuses (HIMT, SRM, …)`}
            value={campusQuery}
            onChange={event => handleCampusQuery(event.target.value)}
          />
          <datalist id="oc-campus-list">
            {allColleges.map(c => (
              <option key={c.name} value={c.name} label={`${c.count} item${c.count === 1 ? '' : 's'}`} />
            ))}
          </datalist>
        </div>
      )}

      <div className="oc-toolbar">
        <label className="oc-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search items on other campuses"
            value={searchInput}
            maxLength={100}
            onChange={event => setSearchInput(event.target.value)}
            aria-label="Search items on other campuses"
          />
        </label>
        <select value={category} onChange={event => setCategory(event.target.value)} aria-label="Category">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort by">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && <div className="auth-error oc-alert" role="alert">{error}</div>}
      {notice && <div className="oc-notice" role="status">{notice}</div>}

      {loading ? (
        <div className="oc-state">Loading items from other campuses…</div>
      ) : listings.length === 0 ? (
        <div className="oc-state oc-empty">
          <strong>
            {selectedCollege && !search && category === 'all'
              ? `No items from ${selectedCollege} yet`
              : hasFilters ? 'No items match these filters' : 'No items from other campuses yet'}
          </strong>
          <p>
            {selectedCollege && !search && category === 'all'
              ? 'Nobody at this campus has listed anything yet. Check back soon, or pick another campus.'
              : hasFilters
                ? 'Try another campus, category or search.'
                : 'When students at other colleges post items, they will show up here.'}
          </p>
          {hasFilters && <button type="button" className="oc-clear" onClick={clearFilters}>{selectedCollege && !search && category === 'all' ? 'See all campuses' : 'Clear filters'}</button>}
        </div>
      ) : (
        <>
          <div className="oc-results">
            Showing <strong>{listings.length}</strong> item{listings.length === 1 ? '' : 's'}
            {selectedCollege ? <> from <strong>{selectedCollege}</strong></> : ' from other campuses'}
          </div>
          <div className="oc-grid">
            {listings.map(item => (
              <ListingCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                type={item.type}
                image={item.image}
                college={item.college}
                status={item.status}
                sellerName={item.sellerName}
                sellerRating={item.sellerRating}
                sellerReviewCount={item.sellerReviewCount}
                sellerTier={item.sellerTier}
                rentDuration={item.rentDuration}
                onSave={saveListing}
                onContact={messageSeller}
                contactLabel={messagingId === item.id ? 'Opening…' : 'Message'}
                contactDisabled={Boolean(messagingId)}
              />
            ))}
          </div>
          {pagination.hasMore && (
            <button type="button" className="oc-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
};
