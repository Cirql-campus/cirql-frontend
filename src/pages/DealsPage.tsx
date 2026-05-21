import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Handshake, MessageCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import { Button } from '../components/ui/Button';
import './WorkspacePages.css';

interface DealUser {
  _id: string;
  name: string;
  initials?: string;
  college?: string;
}

interface DealListing {
  _id: string;
  title: string;
  price: number;
  images?: string[];
  status?: string;
}

interface Deal {
  _id: string;
  listing: DealListing;
  buyer: DealUser;
  seller: DealUser;
  status: 'requested' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'disputed';
  meetupLocation?: string;
  message?: string;
  buyerCompletedAt?: string;
  sellerCompletedAt?: string;
  updatedAt: string;
}

interface Pagination {
  hasMore: boolean;
  page: number;
}

const statusIcon = {
  requested: Clock,
  accepted: Handshake,
  rejected: XCircle,
  cancelled: XCircle,
  completed: CheckCircle2,
  disputed: XCircle,
};

export const DealsPage = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ hasMore: false, page: 1 });
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [reviewDealId, setReviewDealId] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const roleQuery = filter === 'all' ? '' : `?role=${filter}`;
      const separator = roleQuery ? '&' : '?';
      const res = await api.get<{ deals: Deal[]; pagination?: Pagination }>(`/deals${roleQuery}${separator}page=1&limit=20`);
      setDeals(res.deals);
      setPagination(res.pagination || { hasMore: false, page: 1 });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load deals'));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadMore = async () => {
    if (!pagination.hasMore || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const nextPage = pagination.page + 1;
      const roleQuery = filter === 'all' ? '' : `?role=${filter}`;
      const separator = roleQuery ? '&' : '?';
      const res = await api.get<{ deals: Deal[]; pagination?: Pagination }>(`/deals${roleQuery}${separator}page=${nextPage}&limit=20`);
      setDeals(prev => [...prev, ...res.deals]);
      setPagination(res.pagination || { hasMore: false, page: nextPage });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load more deals'));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  const counts = useMemo(() => ({
    active: deals.filter(deal => ['requested', 'accepted'].includes(deal.status)).length,
    completed: deals.filter(deal => deal.status === 'completed').length,
  }), [deals]);

  const updateDeal = async (dealId: string, action: string) => {
    setBusyId(dealId);
    setError('');
    try {
      await api.patch(`/deals/${dealId}/status`, { action });
      await loadDeals();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update deal'));
    } finally {
      setBusyId('');
    }
  };

  const submitReview = async (deal: Deal) => {
    setBusyId(deal._id);
    setError('');
    try {
      await api.post(`/users/${deal.seller?._id}/review`, {
        rating: Number(rating),
        comment,
        listingId: deal.listing?._id,
      });
      setReviewDealId('');
      setComment('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to submit review'));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="workspace-page container">
      <div className="workspace-header">
        <div>
          <h1>Campus Deals</h1>
          <p>Request a meetup, confirm handoff, and unlock trusted reviews without handling payments.</p>
        </div>
        <div className="workspace-metrics">
          <span>{counts.active} active</span>
          <span>{counts.completed} completed</span>
        </div>
      </div>

      <div className="segmented">
        {(['all', 'buyer', 'seller'] as const).map(item => (
          <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
            {item === 'all' ? 'All' : item === 'buyer' ? 'Buying' : 'Selling'}
          </button>
        ))}
      </div>

      {error && <div className="auth-error">{error}</div>}
      {loading ? (
        <div className="empty-state">Loading deals...</div>
      ) : deals.length === 0 ? (
        <div className="empty-state">No deals yet. Open a listing and request one from the seller.</div>
      ) : (
        <div className="workspace-list">
          {deals.map(deal => {
            const isSeller = deal.seller?._id === user?._id;
            const isBuyer = deal.buyer?._id === user?._id;
            const StatusIcon = statusIcon[deal.status] || Clock;
            return (
              <article className="workspace-card" key={deal._id}>
                <div className="workspace-card-main">
                  <img src={deal.listing?.images?.[0] || '/favicon.svg'} alt="" />
                  <div>
                    <div className="card-kicker"><StatusIcon size={14} /> {deal.status}</div>
                    <h2>{deal.listing?.title || 'Deleted Listing'}</h2>
                    <p>₹{deal.listing?.price || 'N/A'} / {deal.meetupLocation || 'Campus meetup'}</p>
                    <p className="muted">Buyer: {deal.buyer?.name || 'Deleted User'} / Seller: {deal.seller?.name || 'Deleted User'}</p>
                    {deal.message && <p className="note">"{deal.message}"</p>}
                    {deal.status === 'accepted' && (
                      <p className="muted">
                        Confirmed by buyer: {deal.buyerCompletedAt ? 'yes' : 'no'} / seller: {deal.sellerCompletedAt ? 'yes' : 'no'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="workspace-actions">
                  {deal.status === 'requested' && isSeller && (
                    <>
                      <Button size="sm" onClick={() => updateDeal(deal._id, 'accept')} disabled={busyId === deal._id}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => updateDeal(deal._id, 'reject')} disabled={busyId === deal._id}>Reject</Button>
                    </>
                  )}
                  {['requested', 'accepted'].includes(deal.status) && (
                    <Button size="sm" variant="outline" onClick={() => updateDeal(deal._id, 'cancel')} disabled={busyId === deal._id}>Cancel</Button>
                  )}
                  {deal.status === 'accepted' && !(isBuyer && deal.buyerCompletedAt) && !(isSeller && deal.sellerCompletedAt) && (
                    <Button size="sm" onClick={() => updateDeal(deal._id, 'complete')} disabled={busyId === deal._id}>
                      Mark Complete
                    </Button>
                  )}
                  {deal.status === 'completed' && isBuyer && deal.seller && (
                    <Button size="sm" variant="secondary" onClick={() => setReviewDealId(reviewDealId === deal._id ? '' : deal._id)}>
                      Review Seller
                    </Button>
                  )}
                  {deal.status === 'accepted' && (
                    <Button size="sm" variant="ghost" onClick={() => updateDeal(deal._id, 'dispute')} disabled={busyId === deal._id}>
                      Dispute
                    </Button>
                  )}
                </div>

                {reviewDealId === deal._id && (
                  <div className="inline-form">
                    <select value={rating} onChange={e => setRating(e.target.value)}>
                      {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} stars</option>)}
                    </select>
                    <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Short review" maxLength={300} />
                    <Button size="sm" onClick={() => submitReview(deal)} disabled={busyId === deal._id}>
                      Submit Review
                    </Button>
                  </div>
                )}

                {deal.status === 'accepted' && (
                  <div className="trust-note">
                    <MessageCircle size={14} /> Meet in a public campus place. Pay directly only after inspecting the item.
                  </div>
                )}
              </article>
            );
          })}
          {pagination.hasMore && (
            <button className="apply-btn" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
