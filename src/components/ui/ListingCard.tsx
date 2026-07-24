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
}

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
}) => {
  const navigate = useNavigate();

  return (
    <div className="prod-card" onClick={() => navigate(`/item/${id}`)}>
      <div className="card-img" style={{ backgroundImage: image && image.length > 3 ? `url(${image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {(!image || image.length < 4) && <div style={{ fontSize: '60px' }}>📦</div>}
        <div className="card-img-bg"></div>
        <div className={`badge badge-${type.toLowerCase() === 'sell' ? 'new' : 'rent'}`}>{type}</div>
        <button className="wishlist-btn" onClick={(e) => { e.stopPropagation(); onSave?.(id); }}>♡</button>
      </div>
      <div className="card-body">
         <div className="card-price">₹{price}</div>
         <div className="card-name">{title}</div>
         <div className="card-meta">
            <div className="card-loc">📍 {college}</div>
            <div className="card-cond new">{status || 'Available'}</div>
         </div>
         {sellerRating !== undefined && sellerRating > 0 && (
           <div className="card-seller-trust">
             <span className="card-seller-stars">
               {'★'.repeat(Math.round(sellerRating))}{'☆'.repeat(5 - Math.round(sellerRating))}
             </span>
             <span className="card-seller-info">
               {sellerRating.toFixed(1)}
               {sellerReviewCount !== undefined && sellerReviewCount > 0
                 ? ` · ${sellerReviewCount} review${sellerReviewCount === 1 ? '' : 's'}`
                 : ''}
             </span>
           </div>
         )}
      </div>
      {!hideFooter && (
        <div className="card-footer">
          <button className="add-cart-btn" onClick={(e) => { e.stopPropagation(); navigate(`/item/${id}`); }}>Details</button>
          <button className="contact-btn" onClick={(e) => { e.stopPropagation(); navigate(`/item/${id}`); }}>Request Deal</button>
        </div>
      )}
    </div>
  );
};
