import React from 'react';
import './SkeletonCard.css';

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-img" />
    <div className="skeleton-body">
      <div className="skeleton-line w-40" />
      <div className="skeleton-line w-75" />
      <div className="skeleton-line w-50" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 8 }: { count?: number }) => (
  <div className="listings-grid">
    {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
  </div>
);

export const SkeletonConversation = () => (
  <div className="skeleton-conversation">
    <div className="skeleton-avatar" />
    <div className="skeleton-body">
      <div className="skeleton-line w-60" />
      <div className="skeleton-line w-80" />
    </div>
  </div>
);

export const SkeletonProfile = () => (
  <div className="skeleton-profile">
    <div className="skeleton-avatar large" />
    <div className="skeleton-body centered">
      <div className="skeleton-line w-40" />
      <div className="skeleton-line w-60" />
      <div className="skeleton-line w-30" />
    </div>
  </div>
);
