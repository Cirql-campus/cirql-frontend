import React, { useState } from 'react';
import { Filter, ChevronDown, PackageSearch } from 'lucide-react';
import { ListingCard } from '../components/ui/ListingCard';
import { EmptyState } from '../components/ui/EmptyState';
import './Browse.css';

const ALL_LISTINGS = [
  { id: '1', title: 'Casio fx-991EX Scientific Calculator', price: 450, type: 'Sell' as const, image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=400&q=80', college: 'IIT Delhi' },
  { id: '2', title: 'Arduino Uno R3 Kit', price: 250, type: 'Rent' as const, image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=400&q=80', college: 'DTU' },
  { id: '3', title: 'Digital Multimeter', price: 300, type: 'Sell' as const, image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=400&q=80', college: 'NSUT' },
  { id: '4', title: 'Raspberry Pi 4 (4GB)', price: 600, type: 'Rent' as const, image: 'https://images.unsplash.com/photo-1601666687445-56fe2ed81745?auto=format&fit=crop&w=400&q=80', college: 'IIITD' },
  { id: '5', title: 'Lab Apron & Glasses', price: 150, type: 'Sell' as const, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80', college: 'IIT Delhi' },
  { id: '6', title: 'Engineering Drafter', price: 200, type: 'Sell' as const, image: 'https://images.unsplash.com/photo-1580584126903-c17d41830450?auto=format&fit=crop&w=400&q=80', college: 'DTU' },
];

export const Browse = () => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="browse-page container">
      <div className="browse-header">
        <h1 className="browse-title">Browse Items</h1>
        <button 
          className="btn btn-outline btn-sm mobile-filter-btn"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <Filter size={16} className="mr-2" />
          Filters
        </button>
      </div>

      <div className="browse-layout">
        <aside className={`filters-sidebar ${showMobileFilters ? 'show' : ''}`}>
          <div className="filter-group">
            <h3 className="filter-title">Type</h3>
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked /> Buy
            </label>
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked /> Rent
            </label>
          </div>

          <div className="filter-group">
            <h3 className="filter-title">Categories</h3>
            <label className="checkbox-label">
              <input type="radio" name="category" /> All Categories
            </label>
            <label className="checkbox-label">
              <input type="radio" name="category" /> Calculators
            </label>
            <label className="checkbox-label">
              <input type="radio" name="category" /> Electronics
            </label>
            <label className="checkbox-label">
              <input type="radio" name="category" /> Lab Tools
            </label>
            <label className="checkbox-label">
              <input type="radio" name="category" /> Projects
            </label>
            <label className="checkbox-label">
              <input type="radio" name="category" /> Gifts
            </label>
          </div>

          <div className="filter-group">
            <h3 className="filter-title">College</h3>
            <select className="filter-select">
              <option>All Colleges</option>
              <option>IIT Delhi</option>
              <option>DTU</option>
              <option>NSUT</option>
            </select>
          </div>
        </aside>

        <div className="browse-content">
          <div className="browse-controls">
            <span className="results-count">{ALL_LISTINGS.length} results found</span>
            <div className="sort-control">
              <span className="text-muted">Sort by:</span>
              <button className="sort-btn">
                Newest <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {ALL_LISTINGS.length > 0 ? (
            <div className="listings-grid-view">
              {ALL_LISTINGS.map(item => (
                <ListingCard 
                  key={item.id} 
                  {...item} 
                  sellerRating={(item as any).seller?.rating}
                  sellerReviewCount={(item as any).seller?.reviewCount}
                  sellerTier={(item as any).seller?.tier}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={PackageSearch}
              title="No Items Found"
              description="We couldn't find any listings matching your active filters. Try expanding your search or selecting 'All Colleges'."
              actionLabel="Clear Filters"
              onAction={() => window.location.reload()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

