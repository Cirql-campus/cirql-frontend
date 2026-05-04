import React, { useEffect, useState } from 'react';
import { ShoppingCart, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../utils/api';
import { ListingCard } from '../components/ui/ListingCard';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

interface ApiListing {
  _id: string;
  title: string;
  price: number;
  type: 'sell' | 'rent' | 'free';
  category: string;
  condition?: string;
  images?: string[];
  college?: string;
  status?: string;
}

export const SavedPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSaved = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ listings: ApiListing[] }>('/listings/saved/me?limit=50');
      const mapped = res.listings.map(l => ({
        id: l._id,
        title: l.title,
        price: l.price,
        type: l.type === 'sell' ? 'Sell' : l.type === 'rent' ? 'Rent' : 'Free',
        category: l.category,
        condition: l.condition || 'Good',
        image: l.images?.[0] || '',
        college: l.college || 'Campus',
        status: l.status || 'available',
      }));
      setListings(mapped);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load saved listings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadSaved();
    }
  }, [isLoggedIn]);

  const handleSaveToggle = async (id: string) => {
    try {
      await api.post(`/listings/${id}/save`, {});
      // Remove from cart instantly if unsaved
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      // ignore
    }
  };

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '32px 20px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <ShoppingCart size={28} color="var(--accent)" />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>Cart / Saved</h1>
      </div>
      
      {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}
      
      {loading ? (
        <div style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '60px' }}>Loading your cart...</div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Your cart is empty"
          description="You haven't saved any listings yet. Browse the marketplace and tap the save icon to add items for later."
          actionLabel="Browse Marketplace"
          onAction={() => navigate('/marketplace')}
        />
      ) : (
        <div className="listings-grid">
          {listings.map(item => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ListingCard {...item} onSave={handleSaveToggle} />
              <button 
                onClick={() => handleSaveToggle(item.id)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  background: 'none', 
                  border: '1px solid var(--gray-200)', 
                  borderRadius: 'var(--radius)', 
                  color: 'var(--danger, #e11d48)', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Remove from Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
