import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flag, Handshake, MessageCircle, Pencil, ShieldCheck, UserX, X } from 'lucide-react';
import { TextDialog } from '../components/ui/AppDialog';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import '../components/layout/Modals.css';
import './ItemDetail.css';

interface Seller {
  _id: string;
  name: string;
  initials?: string;
  avatar?: string;
  college?: string;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  trust?: { score: number; badges: string[]; accountAgeDays: number };
}

interface Listing {
  _id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string;
  condition?: string;
  type: 'sell' | 'rent' | 'free';
  images?: string[];
  seller: Seller;
  college?: string;
  location?: string;
  pickupLocation?: string;
  views?: number;
  isSold?: boolean;
  status?: string;
  brand?: string;
  model?: string;
  tags?: string[];
}

interface Review {
  _id: string;
  rating: number;
  comment?: string;
  reviewer?: { name: string };
}

type ReportTarget = 'listing' | 'seller' | null;

const titleCase = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const formatViews = (views?: number) => {
  if (typeof views !== 'number') return 'Views unavailable';
  return views === 1 ? '1 view' : `${views} views`;
};

export const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerTrust, setSellerTrust] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copyToast, setCopyToast] = useState(false);

  const handleShare = async () => {
    if (!listing) return;
    const url = window.location.href;
    const title = listing.title;
    const text = `Check out "${title}" for ₹${listing.price} on CirQl`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch { /* user cancelled */ }
    } else {
      // Fallback: copy link
      try {
        await navigator.clipboard.writeText(url);
        // Show a brief "Link copied!" toast
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 2500);
      } catch {
        prompt('Copy this link:', url);
      }
    }
  };

  useEffect(() => {
    const loadListing = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const res = await api.get<{ listing: Listing }>(`/listings/${id}`);
        setListing(res.listing);
        setSelectedImageIndex(0);
        const [profileRes, reviewsRes] = await Promise.all([
          api.get<{ user: Seller }>(`/users/${res.listing.seller._id}`),
          api.get<{ reviews: Review[] }>(`/users/${res.listing.seller._id}/reviews?limit=3`),
        ]);
        setSellerTrust(profileRes.user);
        setReviews(reviewsRes.reviews);
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to load listing'));
      } finally {
        setLoading(false);
      }
    };
    loadListing();
  }, [id]);

  const listingImages = useMemo(
    () => listing?.images?.filter(Boolean) ?? [],
    [listing?.images]
  );
  const mainImage = listingImages[selectedImageIndex] || listingImages[0];
  const isOwnListing = Boolean(user && listing?.seller?._id === user._id);
  const unavailable = Boolean(listing?.isSold || listing?.status === 'sold' || listing?.status === 'hidden');
  const sellerReviewCount = sellerTrust?.reviewCount ?? listing?.seller?.reviewCount ?? 0;
  const sellerRating = sellerTrust?.rating ?? listing?.seller?.rating;
  const hasSellerReviews = sellerReviewCount > 0 && typeof sellerRating === 'number';
  const sellerTrustScore = sellerTrust?.trust?.score;
  const sellerLocation = listing?.location || listing?.college || listing?.seller.college || 'Pickup location not added';

  const requireLogin = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!listing || !requireLogin()) return;
    setBusy('save');
    setActionError('');
    try {
      await api.post(`/listings/${listing._id}/save`, {});
      setActionError('Saved listing updated.');
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, 'Failed to update saved listing'));
    } finally {
      setBusy('');
    }
  };

  const handleChat = async () => {
    if (!listing || !requireLogin() || isOwnListing) return;
    setBusy('chat');
    setActionError('');
    try {
      const res = await api.post<{ conversation: { _id: string } }>('/chat/conversations', {
        listingId: listing._id,
        sellerId: listing.seller._id,
      });
      navigate(`/messages/${res.conversation._id}`);
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, 'Failed to start chat'));
    } finally {
      setBusy('');
    }
  };

  const handleDealRequest = async () => {
    if (!listing || !requireLogin() || isOwnListing) return;
    setBusy('deal');
    setActionError('');
    try {
      await api.post('/deals', {
        listingId: listing._id,
        message: 'I am interested in this listing.',
        meetupLocation: listing.pickupLocation || listing.location || '',
      });
      navigate('/deals');
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, 'Failed to request deal'));
    } finally {
      setBusy('');
    }
  };

  const openReport = (target: Exclude<ReportTarget, null>) => {
    if (!requireLogin()) return;
    setReportTarget(target);
    setReportDetails('');
  };

  const submitReport = async () => {
    if (!listing || !reportTarget || !reportDetails.trim()) return;
    setBusy('report');
    try {
      if (reportTarget === 'listing') {
        await api.post(`/listings/${listing._id}/report`, { reason: 'other', details: reportDetails.trim() });
        setActionError('Listing reported. Admin will review it.');
      } else {
        await api.post(`/users/${listing.seller._id}/report`, { reason: 'other', details: reportDetails.trim() });
        setActionError('Seller reported. Admin will review it.');
      }
      setReportTarget(null);
      setReportDetails('');
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, 'Failed to send report'));
    } finally {
      setBusy('');
    }
  };

  const blockUser = async () => {
    if (!listing || !requireLogin()) return;
    await api.post(`/users/${listing.seller._id}/block`, { reason: 'Blocked from listing page' });
    setActionError('Seller blocked. Chat is now unavailable.');
  };

  return (
    <div className="modal-bg open" onClick={(event) => { if (event.target === event.currentTarget) navigate(-1); }}>
      <div className="modal item-detail-modal">
        <div className="modal-header">
          <div className="drawer-title">Product Details</div>
          <button className="modal-close" onClick={() => navigate(-1)} aria-label="Close"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="detail-state">Loading listing...</div>
        ) : error || !listing ? (
          <div className="detail-state">
            <strong>Listing unavailable</strong>
            <p>{error || 'This listing could not be found.'}</p>
            <button className="apply-btn compact" onClick={() => navigate('/marketplace')}>Back to Marketplace</button>
          </div>
        ) : (
          <div className="detail-grid">
            <div>
              <div className="detail-main-image">
                {mainImage ? <img src={mainImage} alt={listing.title} /> : <span>No photo</span>}
              </div>
              {listingImages.length > 1 && (
                <div className="detail-thumbnail-row" aria-label="Listing photos">
                  {listingImages.map((image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      className={`detail-thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                      aria-label={`Show photo ${index + 1}`}
                      aria-current={index === selectedImageIndex ? 'true' : undefined}
                    >
                      <img src={image} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="detail-content">
              <div className="detail-price">₹{listing.price}</div>
              <h1 className="detail-title">{listing.title}</h1>

              <div className="seller-summary">
                <div className="seller-avatar-solid">
                  {listing.seller.initials || listing.seller.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="seller-name-line">
                    {listing.seller.name}
                    {listing.seller.isVerified && <ShieldCheck size={15} color="var(--accent)" />}
                  </div>
                  <div className="detail-muted">
                    {sellerLocation} / {formatViews(listing.views)}
                  </div>
                  <div className="detail-muted">
                    {hasSellerReviews
                      ? `Trust ${sellerTrustScore ?? 'unrated'}/100 / ${sellerRating.toFixed(1)} stars / ${sellerReviewCount} reviews`
                      : `${listing.seller.isVerified ? 'Verified college seller' : 'Seller profile'} / Trust profile building / No reviews yet`}
                  </div>
                </div>
              </div>

              <div className="detail-description">
                <p>{listing.description || 'No description was provided for this listing.'}</p>
              </div>

              <dl className="detail-table">
                <div><dt>Category</dt><dd>{titleCase(listing.category)}</dd></div>
                <div><dt>Condition</dt><dd>{listing.condition || 'Not added'}</dd></div>
                <div><dt>Type</dt><dd>{listing.type}</dd></div>
                <div><dt>Status</dt><dd>{listing.status || 'available'}</dd></div>
                <div><dt>Brand</dt><dd>{listing.brand || 'Not added'} {listing.model || ''}</dd></div>
                <div><dt>Pickup</dt><dd>{listing.pickupLocation || listing.location || 'Pickup location not added'}</dd></div>
              </dl>

              {reviews.length > 0 && (
                <div className="reviews-block">
                  <h2>Recent reviews</h2>
                  {reviews.map(review => (
                    <p key={review._id}>
                      {review.rating} stars / {review.comment || 'No comment'} / {review.reviewer?.name || 'Student'}
                    </p>
                  ))}
                </div>
              )}

              {actionError && <div className="auth-error detail-alert">{actionError}</div>}

              <div className="detail-actions">
                {isOwnListing && (
                  <button onClick={() => navigate(`/listings/${listing._id}/edit`)} className="detail-action accent">
                    <Pencil size={17} /> Edit Your Listing
                  </button>
                )}
                <button onClick={handleDealRequest} disabled={busy === 'deal' || isOwnListing || unavailable} className="detail-action accent">
                  <Handshake size={17} /> {busy === 'deal' ? 'Requesting...' : 'Request Deal'}
                </button>
                <button onClick={handleChat} disabled={busy === 'chat' || isOwnListing || unavailable} className="detail-action dark">
                  <MessageCircle size={17} /> {isOwnListing ? 'This is your listing' : busy === 'chat' ? 'Opening chat...' : 'Message Seller'}
                </button>
                <button onClick={handleSave} disabled={busy === 'save'} className="detail-action light">
                  {busy === 'save' ? 'Saving...' : 'Save Listing'}
                </button>
                <button className="share-btn" onClick={handleShare} aria-label="Share listing">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16,6 12,2 8,6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Share
                </button>

                {copyToast && (
                  <div className="copy-toast">✓ Link copied to clipboard</div>
                )}

                {!isOwnListing && (
                  <div className="report-actions">
                    <button onClick={() => openReport('listing')}><Flag size={14} /> Listing</button>
                    <button onClick={() => openReport('seller')}><Flag size={14} /> Seller</button>
                    <button onClick={blockUser}><UserX size={14} /> Block</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <TextDialog
        open={Boolean(reportTarget)}
        title={reportTarget === 'seller' ? 'Report seller' : 'Report listing'}
        description="Tell us what looks unsafe, misleading, or suspicious. Admin will review it."
        value={reportDetails}
        placeholder="Write the reason for this report..."
        submitLabel="Send report"
        loading={busy === 'report'}
        onChange={setReportDetails}
        onCancel={() => setReportTarget(null)}
        onSubmit={submitReport}
      />
    </div>
  );
};
