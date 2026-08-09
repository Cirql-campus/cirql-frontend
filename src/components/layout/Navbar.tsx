import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bed,
  Bell,
  Bike,
  BookOpen,
  Handshake,
  Laptop,
  LogOut,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  User,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../ui/Logo';
import './Navbar.css';

const NAV_CATEGORIES = [
  { label: 'All', value: 'all', Icon: Package },
  { label: 'Books & Notes', value: 'Academia', Icon: BookOpen },
  { label: 'Electronics', value: 'Tech', Icon: Laptop },
  { label: 'Vehicles', value: 'Rides', Icon: Bike },
  { label: 'Room & Living', value: 'Living', Icon: Bed },
  { label: 'Clothing', value: 'Attire', Icon: Shirt },
  { label: 'Gifts', value: 'Gifts', Icon: ShoppingBag },
];

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const showSubnav = isHomePage || location.pathname === '/marketplace';
  const { user, logout, unreadMessages, unreadAlerts, isAnyAdmin } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ title: string; link?: string; actionText?: string } | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchSuggestions(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfile(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearchSuggestions(false);
        setShowProfile(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    import('../../utils/socket').then(({ getSocket }) => {
      const socket = getSocket();
      if (!socket) return;
      
      const handleNewListing = (data: { title: string, id?: string }) => {
        setToast({
          title: `New listing posted: ${data.title}`,
          link: data.id ? `/item/${data.id}` : '/marketplace',
          actionText: 'Click to view'
        });
        setTimeout(() => setToast(null), 4000);
      };

      const handleNewNotification = ({ notification }: { notification: any }) => {
        if (notification?.text) {
          setToast({
            title: notification.text,
            link: notification.link || '/notifications',
            actionText: 'Click to view'
          });
          setTimeout(() => setToast(null), 4000);
        }
      };
      
      socket.on('new_listing', handleNewListing);
      socket.on('new_notification', handleNewNotification);
      return () => {
        socket.off('new_listing', handleNewListing);
        socket.off('new_notification', handleNewNotification);
      };
    }).catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    setShowProfile(false);
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const goToMarketplace = (category = searchCategory, query = searchQuery) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (query.trim()) params.set('search', query.trim());
    navigate(`/marketplace${params.toString() ? `?${params.toString()}` : ''}`);
    setShowProfile(false);
    setShowSearchSuggestions(false);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    goToMarketplace();
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="logo-wrap">
            <Logo size={26} />
          </Link>

          {!isHomePage && (
            <form className="search-wrap" onSubmit={handleSearch} ref={searchRef}>
              <select
                className="search-cat"
                value={searchCategory}
                onChange={(event) => setSearchCategory(event.target.value)}
                aria-label="Search category"
              >
                <option value="all">All Categories</option>
                <option value="Academia">Books & Notes</option>
                <option value="Tech">Electronics</option>
                <option value="Rides">Vehicles</option>
                <option value="Living">Room & Living</option>
                <option value="Attire">Clothing</option>
                <option value="Gifts">Gifts</option>
              </select>
              <input
                type="text"
                className="search-input"
                placeholder="Search for anything on campus."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowSearchSuggestions(event.target.value.trim().length > 0);
                }}
                onFocus={() => setShowSearchSuggestions(searchQuery.trim().length > 0)}
              />
              <button className="search-btn" type="submit">
                <Search size={16} /> Search
              </button>
              {showSearchSuggestions && searchQuery.trim().length > 0 && (
                <div className="search-suggestions">
                  <button type="button" className="suggestion-item" onClick={() => goToMarketplace('all', searchQuery)}>
                    Search "{searchQuery}" in all campus items
                  </button>
                  <button type="button" className="suggestion-item" onClick={() => goToMarketplace(searchCategory, searchQuery)}>
                    Search inside selected category
                  </button>
                </div>
              )}
            </form>
          )}

          <div className="nav-actions">
            {user ? (
              <>
                <button className="nav-btn" onClick={() => navigate('/messages')} style={{ position: 'relative' }}>
                  <MessageCircle size={16} /> <span className="nav-label">Messages</span>
                  {unreadMessages > 0 && <span className="nav-badge">{unreadMessages > 9 ? '9+' : unreadMessages}</span>}
                </button>
                <button className="nav-btn" onClick={() => navigate('/deals')}>
                  <Handshake size={16} /> <span className="nav-label">Deals</span>
                </button>
                <button className="nav-btn" onClick={() => navigate('/saved')}>
                  <ShoppingCart size={16} /> <span className="nav-label">Cart</span>
                </button>
                <button className="nav-btn" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
                  <Bell size={16} /> <span className="nav-label">Alerts</span>
                  {unreadAlerts > 0 && <span className="nav-badge">{unreadAlerts > 9 ? '9+' : unreadAlerts}</span>}
                </button>
                <div className="profile-dropdown" ref={profileRef}>
                  <button className="profile-btn" onClick={() => setShowProfile(!showProfile)} aria-label="Open profile menu">
                    {initials}
                  </button>
                  {showProfile && (
                    <div className="dropdown-menu open">
                      <div className="drop-user-info">
                        <div className="drop-user-name">{user.name}</div>
                        <div className="drop-user-campus">{user.college}</div>
                      </div>
                      <div className="drop-divider" />
                      <button className="drop-item" onClick={() => { navigate('/dashboard'); setShowProfile(false); }}>
                        <User size={16} /> Dashboard
                      </button>
                      <button className="drop-item" onClick={() => { navigate('/profile?tab=edit'); setShowProfile(false); }}>
                        <User size={16} /> My Profile
                      </button>
                      <button className="drop-item" onClick={() => { navigate('/profile?tab=listings'); setShowProfile(false); }}>
                        <Package size={16} /> My Listings
                      </button>
                      <button className="drop-item" onClick={() => { navigate('/spot-hub'); setShowProfile(false); }}>
                        <Compass size={16} /> Spot Hub
                      </button>
                      {isAnyAdmin && (
                        <button className="drop-item" onClick={() => { navigate('/admin'); setShowProfile(false); }}>
                          <ShieldCheck size={16} /> Admin
                        </button>
                      )}
                      <div className="drop-divider" />
                      <button className="drop-item drop-item-danger" onClick={handleLogout}>
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className="nav-btn nav-btn-outline" onClick={() => navigate('/login')}>
                  <User size={16} /> <span className="nav-label">Login</span>
                </button>
                <button className="nav-btn nav-btn-green" onClick={() => navigate('/signup')}>
                  <span className="nav-label">Sign Up Free</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {showSubnav && (
        <div className="subnav">
          <div className="subnav-inner">
            {NAV_CATEGORIES.map(({ label, value, Icon }) => (
              <button key={value} className="cat-pill" type="button" onClick={() => goToMarketplace(value, '')}>
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {toast && (
        <div
          className="live-toast"
          onClick={() => {
            navigate(toast.link || '/marketplace');
            setToast(null);
          }}
        >
          {toast.title} <span>{toast.actionText || 'Click to view'}</span>
        </div>
      )}
    </>
  );
};


