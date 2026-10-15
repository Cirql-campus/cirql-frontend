import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ListingCard.css';

export interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  type: string;
  image: string;
  college: string;
  status?: string;
  onSave?: (id: string) => void;
  hideFooter?: boolean;
  sellerRating?: number;
  sellerReviewCount?: number;
  sellerName?: string;
  rentDuration?: string;
  sellerTier?: string;
  /** Replaces the default "Request Deal" action (e.g. "Message" on the Other Campuses page). */
  onContact?: (id: string) => void;
  contactLabel?: string;
  contactDisabled?: boolean;
}

const getBadgeInfo = (type: string) => {
  const norm = type.toLowerCase();
  if (norm === 'sell') return { emoji: '', label: 'Sell' };
  if (norm === 'rent') return { emoji: '', label: 'Rent' };
  if (norm === 'free') return { emoji: '🎁', label: 'Free' };
  return { emoji: '💼', label: 'Service' };
};

const getRentPeriod = (rentDuration?: string) => {
  if (!rentDuration) return '/mo';
  const d = rentDuration.toLowerCase();
  if (d === 'hourly') return '/hr';
  if (d === 'daily') return '/day';
  if (d === 'weekly') return '/wk';
  if (d === 'monthly') return '/mo';
  if (d === 'semester') return '/sem';
  return `/${d}`;
};

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  type,
  image,
  college,
  status,
  onSave,
  hideFooter = false,
  sellerRating,
  sellerReviewCount,
  sellerName,
  rentDuration,
  sellerTier,
  onContact,
  contactLabel,
  contactDisabled = false,
}) => {
  const navigate = useNavigate();
  const badgeInfo = getBadgeInfo(type);

  return (
    <div className={`prod-card prod-card--${type.toLowerCase()}`} onClick={() => navigate(`/item/${id}`)}>
      <div className="card-img" style={{ backgroundImage: image && image.length > 3 ? `url(${image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {(!image || image.length < 4) && <div style={{ fontSize: '60px' }}>📦</div>}
        <div className="card-img-bg"></div>
        <div className={`badge badge-${type.toLowerCase()}`}>
          {badgeInfo.emoji ? `${badgeInfo.emoji} ` : ''}{badgeInfo.label}
        </div>
        <button className="wishlist-btn" onClick={(e) => { e.stopPropagation(); onSave?.(id); }}>♡</button>
      </div>
      <div className="card-body">
         <div className="card-price">
           ₹{price}
           {type.toLowerCase() === 'rent' && (
             <span className="card-price-period"> {getRentPeriod(rentDuration)}</span>
           )}
         </div>
         <div className="card-name">{title}</div>
         <div className="card-meta">
            <div className="card-loc">📍 {college}</div>
            <div className="card-cond new">{status || 'Available'}</div>
         </div>
         {sellerReviewCount !== undefined && sellerReviewCount > 0 && sellerRating !== undefined && sellerRating > 0 && (
           <div className="card-seller-trust">
             <span className="card-seller-stars">
               {'★'.repeat(Math.round(sellerRating))}{'☆'.repeat(5 - Math.round(sellerRating))}
             </span>
             <span className="card-seller-info">
               {sellerRating.toFixed(1)}
               {` · ${sellerReviewCount} review${sellerReviewCount === 1 ? '' : 's'}`}
             </span>
             {sellerTier && sellerTier !== 'new' && (
               <span className="card-tier-badge">
                 {sellerTier === 'regular' ? '🟢' :
                  sellerTier === 'trusted' ? '🔵' :
                  sellerTier === 'star_seller' ? '⭐' :
                  sellerTier === 'campus_legend' ? '🏆' : ''}
               </span>
             )}
           </div>
         )}
      </div>
      {!hideFooter && (
        <div className="card-footer">
          <button className="add-cart-btn" onClick={(e) => { e.stopPropagation(); navigate(`/item/${id}`); }}>Details</button>
          <button
            className="contact-btn"
            disabled={contactDisabled}
            onClick={(e) => {
              e.stopPropagation();
              if (onContact) onContact(id);
              else navigate(`/item/${id}`);
            }}
          >
            {contactLabel ?? 'Request Deal'}
          </button>
        </div>
      )}
    </div>
  );
};
