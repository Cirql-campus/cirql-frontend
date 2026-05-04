import React from 'react';
import { useNavigate } from 'react-router-dom';

const categories = [
  { name: 'Books & Notes', icon: '📚' },
  { name: 'Laptops', icon: '💻' },
  { name: 'Mobile', icon: '📱' },
  { name: 'Audio', icon: '🎧' },
  { name: 'Gadgets', icon: '🔌' },
  { name: 'Stationery', icon: '✏️' },
  { name: 'Lab Kits', icon: '🔬' },
  { name: 'Bicycles', icon: '🚲' },
  { name: 'Scooters', icon: '🛵' },
  { name: 'Furniture', icon: '🪑' },
  { name: 'Mattress', icon: '🛏️' },
  { name: 'Decor', icon: '🪴' },
  { name: 'Appliances', icon: '☕' },
  { name: 'Gaming', icon: '🎮' },
  { name: 'Sports', icon: '⚽' },
  { name: 'Musical', icon: '🎸' },
  { name: 'Clothing', icon: '👕' },
  { name: 'Backpacks', icon: '🎒' },
  { name: 'Calculators', icon: '🧮' },
  { name: 'Services', icon: '🤝' },
];

export const Categories = () => {
  const navigate = useNavigate();

  return (
    <div className="categories-container">
      <style>{`
        .categories-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 20px;
          text-align: center;
        }
        .categories-intro {
          margin-bottom: 40px;
        }
        .categories-heading {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 800;
          color: var(--gray-900);
          margin-bottom: 12px;
        }
        .categories-desc {
          font-size: 16px;
          color: var(--gray-500);
          max-width: 600px;
          margin: 0 auto;
        }
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (min-width: 480px) {
          .categories-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 768px) {
          .categories-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1024px) {
          .categories-grid { grid-template-columns: repeat(5, 1fr); }
        }
        .category-card {
          background: #fff;
          border: 1px solid var(--gray-200);
          border-radius: 16px;
          padding: 24px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          border-color: #22c55e;
        }
        .category-icon {
          font-size: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          background: #f8fafc;
          border-radius: 50%;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .category-card:hover .category-icon {
          transform: scale(1.1);
          background: rgba(34, 197, 94, 0.1);
        }
        .category-name {
          font-weight: 600;
          font-size: 15px;
          color: var(--gray-800);
        }
      `}</style>

      <div className="categories-intro">
        <h2 className="categories-heading">Explore Categories</h2>
        <p className="categories-desc">
          Find exactly what you need. From course materials to room essentials, all available right on your campus.
        </p>
      </div>

      <div className="categories-grid">
        {categories.map((cat, idx) => (
          <div 
            key={idx} 
            className="category-card"
            onClick={() => navigate(`/dashboard?category=${encodeURIComponent(cat.name)}`)}
          >
            <div className="category-icon">{cat.icon}</div>
            <div className="category-name">{cat.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
